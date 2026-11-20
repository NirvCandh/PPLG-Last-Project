param([string]$ExportDirectory = 'dist/web')
$ErrorActionPreference = 'Stop'
$taskRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$exportRoot = [System.IO.Path]::GetFullPath((Join-Path $taskRoot $ExportDirectory))
if (-not (Test-Path -LiteralPath (Join-Path $exportRoot 'index.html') -PathType Leaf)) {
    throw 'Ekspor HTML5 GDevelop dahulu. Folder harus berisi index.html.'
}
$releaseRoot = Join-Path $taskRoot 'release'
New-Item -ItemType Directory -Force -Path $releaseRoot | Out-Null
$archive = Join-Path $releaseRoot 'CircuitQuest-HTML5.zip'
Compress-Archive -Path (Join-Path $exportRoot '*') -DestinationPath $archive -Force
Write-Output "Siap diunggah: $archive"
