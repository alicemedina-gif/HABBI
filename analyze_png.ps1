Add-Type -AssemblyName System.Drawing
$path = 'c:\Users\alice\Downloads\habbi app\assets\ilustraçoes\cigarro_Prancheta 1.png'
$bmp = [System.Drawing.Bitmap]::FromFile($path)
$minY = $bmp.Height
$maxY = 0
for ($y = 0; $y -lt $bmp.Height; $y += 2) {
    for ($x = 0; $x -lt $bmp.Width; $x += 2) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 20) {
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
$topPct = [math]::Round(($minY / $bmp.Height) * 100, 2)
$botPct = [math]::Round(($maxY / $bmp.Height) * 100, 2)
Write-Output "Width: $($bmp.Width) Height: $($bmp.Height)"
Write-Output "minY: $minY ($topPct %)"
Write-Output "maxY: $maxY ($botPct %)"
$bmp.Dispose()
