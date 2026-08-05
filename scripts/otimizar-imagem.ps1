# Redimensiona e converte imagens para JPEG.
# Uso: powershell -File scripts/otimizar-imagem.ps1 -Origem entrada.png -Destino saida.jpg -Largura 1200 -Altura 630 -Qualidade 82
# Altura 0 mantem a proporcao da origem. Cobrir=1 recorta para preencher o quadro.

param(
  [Parameter(Mandatory = $true)][string]$Origem,
  [Parameter(Mandatory = $true)][string]$Destino,
  [int]$Largura = 1200,
  [int]$Altura = 0,
  [int]$Qualidade = 82,
  [int]$Cobrir = 1
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile((Resolve-Path $Origem))

if ($Altura -le 0) {
  $Altura = [int][Math]::Round($Largura * $src.Height / $src.Width)
}

$canvas = New-Object System.Drawing.Bitmap($Largura, $Altura)
$canvas.SetResolution(72, 72)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::White)

if ($Cobrir -eq 1) {
  # Recorta o excedente para preencher o quadro sem distorcer.
  $escala = [Math]::Max($Largura / $src.Width, $Altura / $src.Height)
  $w = $src.Width * $escala
  $h = $src.Height * $escala
  $g.DrawImage($src, [float](($Largura - $w) / 2), [float](($Altura - $h) / 2), [float]$w, [float]$h)
} else {
  $g.DrawImage($src, 0, 0, $Largura, $Altura)
}

if ([System.IO.Path]::GetExtension($Destino) -eq '.png') {
  # PNG preserva a nitidez de bordas de letra nos logos.
  $canvas.Save((Join-Path (Get-Location) $Destino), [System.Drawing.Imaging.ImageFormat]::Png)
} else {
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Qualidade)
  $canvas.Save((Join-Path (Get-Location) $Destino), $codec, $params)
}

$g.Dispose(); $canvas.Dispose(); $src.Dispose()

$kb = [Math]::Round((Get-Item $Destino).Length / 1KB)
Write-Output "$Destino  ${Largura}x${Altura}  ${kb}KB"
