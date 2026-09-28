<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Label Barcode Buku</title>
    <style>
        body { font-family: sans-serif; font-size: 10px; }
        .grid { display: flex; flex-wrap: wrap; }
        .label { width: 32%; margin: 0.5% 0.5%; border: 1px solid #999; border-radius: 4px; padding: 6px; box-sizing: border-box; }
        .judul { font-weight: bold; font-size: 10px; margin-bottom: 2px; max-height: 24px; overflow: hidden; }
        .kode { text-align: center; font-family: 'Courier New', monospace; font-size: 15px; font-weight: bold; letter-spacing: 3px; border-top: 1px dashed #333; border-bottom: 1px dashed #333; padding: 4px 0; margin: 4px 0; }
        .inv { font-size: 9px; color: #555; text-align: center; }
    </style>
</head>
<body>
    <div class="grid">
        @foreach ($eksemplar as $e)
            <div class="label">
                <div class="judul">{{ $e->buku->judul }}</div>
                <div class="kode">*{{ $e->barcode }}*</div>
                <div class="inv">{{ $e->kode_inventaris }}</div>
            </div>
        @endforeach
    </div>
</body>
</html>
