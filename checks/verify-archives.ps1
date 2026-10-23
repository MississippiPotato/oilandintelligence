$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$lock = Get-Content -Raw -Encoding UTF8 (Join-Path $taskRoot 'handoff/package-lock.json') | ConvertFrom-Json
$records = @()
foreach ($item in $lock.archives) {
  $archivePath = Join-Path $taskRoot $item.path
  $zipHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($zipHash -ne $item.sha256) { throw "Archive hash mismatch: $($item.path)" }
  $zip = [IO.Compression.ZipFile]::OpenRead($archivePath)
  $matched = 0
  $readOnly = 0
  try {
    foreach ($entry in $zip.Entries) {
      $relative = $item.sourcePrefix + $entry.FullName
      $sourcePath = [IO.Path]::GetFullPath((Join-Path $taskRoot $relative))
      if (-not $sourcePath.StartsWith($taskRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Path outside workspace' }
      $sourceHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant()
      $stream = $entry.Open()
      $sha = [Security.Cryptography.SHA256]::Create()
      try { $entryHash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
      finally { $stream.Dispose(); $sha.Dispose() }
      if ($entryHash -ne $sourceHash) { throw "Decoded file mismatch: $relative" }
      if ($entry.FullName.StartsWith('portal-original/')) {
        if (($entry.ExternalAttributes -band 1) -ne 1) { throw 'Original copy lost readonly attribute' }
        $readOnly++
      }
      $matched++
    }
    if ($matched -ne $item.entries) { throw 'Entry count mismatch' }
  } finally { $zip.Dispose() }
  $records += [ordered]@{ archive=$item.path; sha256=$zipHash; standardDotNetReader='passed'; entriesMatchedWithCurrentFiles=$matched; readOnlyOriginalEntries=$readOnly }
}
$json = ConvertTo-Json -InputObject $records -Depth 8
[IO.File]::WriteAllText((Join-Path $taskRoot 'handoff/archive-verification.json'), $json, [Text.UTF8Encoding]::new($false))
$records | ForEach-Object { [pscustomobject]$_ } | Select-Object archive,entriesMatchedWithCurrentFiles,readOnlyOriginalEntries
