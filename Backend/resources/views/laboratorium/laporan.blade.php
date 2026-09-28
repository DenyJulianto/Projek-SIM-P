<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $judul }}</title>
    <style>
        body { font-family: sans-serif; font-size: 9px; }
        h1 { font-size: 13px; text-align: center; margin: 0; }
        h2 { font-size: 11px; text-align: center; margin: 2px 0 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #999; padding: 3px 4px; text-align: left; }
        th { background: #eee; }
    </style>
</head>
<body>
    <h1>{{ $sekolah }}</h1>
    <h2>{{ $judul }}</h2>
    <table>
        <thead>
            <tr>
                @foreach ($header as $h)
                    <th>{{ $h }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
        @forelse ($baris as $row)
            <tr>
                @foreach ($row as $cell)
                    <td>{{ $cell }}</td>
                @endforeach
            </tr>
        @empty
            <tr><td colspan="{{ count($header) }}" style="text-align:center;">Tidak ada data.</td></tr>
        @endforelse
        </tbody>
    </table>
</body>
</html>
