<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientDocument;
use App\Models\Document;
use App\Support\FileConverter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Client::with('members')
            ->withCount('documents')
            ->when($request->search, function ($q) use ($request) {
                $q->whereHas('members', fn ($m) => $m->where('name', 'like', "%{$request->search}%")
                    ->orWhere('nik', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%"));
            })
            ->latest();

        return response()->json($query->paginate($request->per_page ?? 15));
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'source' => 'required|in:bank,notaris,developer,umum',
            'source_detail' => 'required|array',
            'source_detail.bank_name' => 'required_if:source,bank|nullable|string|max:255',
            'source_detail.branch_name' => 'required_if:source,bank|nullable|string|max:255',
            'source_detail.leader_name' => 'required_if:source,bank|nullable|string|max:255',
            'source_detail.notary_name' => 'required_if:source,notaris|nullable|string|max:255',
            'source_detail.pic_name' => 'required_if:source,notaris|nullable|string|max:255',
            'source_detail.pic_phone' => 'required_if:source,notaris|nullable|string|max:20',
            'source_detail.developer_name' => 'required_if:source,developer|nullable|string|max:255',
            'source_detail.housing_name' => 'required_if:source,developer|nullable|string|max:255',
            'source_detail.name' => 'required_if:source,umum|nullable|string|max:255',
            'source_detail.phone' => 'required_if:source,umum|nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        $client = DB::transaction(fn () => Client::create([
            'source' => $request->source,
            'source_detail' => $request->source_detail,
        ]));

        $client->load('members');

        return response()->json(['message' => 'Sumber nasabah berhasil disimpan', 'client' => $client], 201);
    }

    public function show(int $id): JsonResponse
    {
        $client = Client::with(['user', 'members', 'clientDocuments.member'])
            ->withCount('documents')
            ->findOrFail($id);
        return response()->json(['client' => $client]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $client = Client::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'source' => 'sometimes|in:bank,notaris,developer,umum',
            'source_detail' => 'sometimes|array',
            'status' => 'sometimes|in:draft,confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        $data = [];
        if ($request->has('source')) {
            $data['source'] = $request->source;
            $data['source_detail'] = $request->source_detail ?? $client->source_detail;
        }
        if ($request->has('status')) {
            $data['status'] = $request->status;
        }
        if (!empty($data)) {
            $client->update($data);
        }

        $client->load(['members', 'clientDocuments.member']);

        return response()->json(['message' => 'Nasabah berhasil diperbarui', 'client' => $client]);
    }

    public function updateMembers(Request $request, int $id): JsonResponse
    {
        $client = Client::findOrFail($id);

        $rules = [
            'members' => 'required|array|min:1',
            'members.*.id' => 'nullable|integer|exists:client_members,id',
            'members.*.name' => 'required|string|max:255',
            'members.*.nik' => 'nullable|string|max:20',
            'members.*.phone' => 'nullable|string|max:20',
            'members.*.email' => 'nullable|email',
            'members.*.npwp' => 'nullable|string|max:30',
            'members.*.address' => 'nullable|string',
            'members.*.gender' => 'nullable|in:male,female',
            'members.*.marital_status' => 'nullable|in:single,married,married_foreign,married_prenup,divorced,widowed',
        ];

        // NIK unik antar anggota (abaikan baris soft-deleted dan id member itu sendiri).
        foreach ($request->input('members', []) as $i => $member) {
            if (!empty($member['nik'])) {
                $rules["members.{$i}.nik"] = [
                    'nullable', 'string', 'max:20',
                    Rule::unique('client_members', 'nik')
                        ->ignore($member['id'] ?? null)
                        ->withoutTrashed(),
                ];
            }
        }

        // NIK tidak boleh kembar di dalam payload yang sama.
        $niks = array_values(array_filter(array_map(
            fn ($m) => is_array($m) ? ($m['nik'] ?? null) : null,
            $request->input('members', [])
        )));
        if (count($niks) !== count(array_unique($niks))) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => ['members' => ['NIK duplikat ditemukan di dalam daftar anggota']],
            ], 422);
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        DB::transaction(function () use ($request, $client) {
            $memberFields = ['name', 'nik', 'phone', 'email', 'npwp', 'gender', 'marital_status', 'address', 'birth_date', 'notes'];

            // $keepIds = semua member yang dipertahankan (di-update + yang baru dibuat).
            $keepIds = [];
            foreach ($request->members as $member) {
                $data = collect($member)->only($memberFields)->all();
                if (!empty($member['id'])) {
                    $existing = $client->members()->find($member['id']);
                    if ($existing) {
                        $existing->update($data);
                        $keepIds[] = $existing->id;
                        continue;
                    }
                }
                $keepIds[] = $client->members()->create($data)->id;
            }

            // Hapus member lama yang tidak ada di daftar beserta dokumennya (jangan sisakan dokumen yatim).
            $removedMembers = $client->members()->whereNotIn('id', $keepIds)->get();
            foreach ($removedMembers as $removed) {
                foreach ($removed->clientDocuments as $doc) {
                    Storage::disk('public')->delete($doc->path);
                    $doc->delete();
                }
                $removed->delete();
            }

            // Sinkronkan kolom legacy clients.* dari member pertama agar
            // kode/portal lama yang masih membaca field ini tetap benar.
            $first = $client->members()->oldest('id')->first();
            if ($first) {
                $client->update([
                    'name' => $first->name,
                    'nik' => $first->nik,
                    'phone' => $first->phone,
                    'email' => $first->email,
                ]);
            }
        });

        $client->load(['members', 'clientDocuments.member']);

        return response()->json(['message' => 'Data nasabah berhasil disimpan', 'client' => $client]);
    }

    public function uploadDocument(Request $request, int $id): JsonResponse
    {
        $client = Client::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
            'doc_type' => 'required|string',
            'client_member_id' => 'nullable|integer|exists:client_members,id',
            'label' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        $file = $request->file('file');

        // Replace dokumen lama dengan doc_type sama (kecuali 'lainnya' yang boleh banyak).
        if ($request->doc_type !== 'lainnya') {
            $existing = ClientDocument::where('client_id', $id)
                ->where('doc_type', $request->doc_type)
                ->where(function ($q) use ($request) {
                    $request->client_member_id
                        ? $q->where('client_member_id', $request->client_member_id)
                        : $q->whereNull('client_member_id');
                })
                ->get();

            foreach ($existing as $old) {
                Storage::disk('public')->delete($old->path);
                $old->delete();
            }
        }

        $path = FileConverter::store($file, "clients/{$id}/documents");

        $doc = ClientDocument::create([
            'client_id' => $id,
            'client_member_id' => $request->client_member_id,
            'doc_type' => $request->doc_type,
            'label' => $request->label,
            'filename' => basename($path),
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'size' => Storage::disk('public')->size($path),
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json(['message' => 'Dokumen berhasil diupload', 'document' => $doc], 201);
    }

    public function deleteDocument(Request $request, int $id, int $fileId): JsonResponse
    {
        $doc = ClientDocument::where('client_id', $id)->findOrFail($fileId);
        Storage::disk('public')->delete($doc->path);
        $doc->delete();
        return response()->json(['message' => 'Dokumen berhasil dihapus']);
    }

    public function destroy(int $id): JsonResponse
    {
        Client::findOrFail($id)->delete();
        return response()->json(['message' => 'Nasabah berhasil dihapus']);
    }

    public function orders(Request $request, int $id): JsonResponse
    {
        $client = Client::findOrFail($id);
        $documents = Document::with('documentType')
            ->where('client_id', $id)
            ->latest()
            ->paginate(20);

        return response()->json($documents);
    }
}
