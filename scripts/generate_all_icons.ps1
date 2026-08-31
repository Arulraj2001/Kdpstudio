Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\logo-option-2.jpg"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found at $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image {
    param (
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$DestinationPath,
        [System.Drawing.Imaging.ImageFormat]$Format
    )

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $destImage = New-Object System.Drawing.Bitmap($Width, $Height)
    $destImage.SetResolution($Image.HorizontalResolution, $Image.VerticalResolution)

    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $wrapMode = New-Object System.Drawing.Imaging.ImageAttributes
    $wrapMode.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)

    $graphics.DrawImage($Image, $destRect, 0, 0, $Image.Width, $Image.Height, [System.Drawing.GraphicsUnit]::Pixel, $wrapMode)
    $graphics.Dispose()
    $wrapMode.Dispose()

    $destDir = [System.IO.Path]::GetDirectoryName($DestinationPath)
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    $destImage.Save($DestinationPath, $Format)
    $destImage.Dispose()
    Write-Host "Created: $DestinationPath ($Width x $Height)"
}

$pngFormat = [System.Drawing.Imaging.ImageFormat]::Png
$icoFormat = [System.Drawing.Imaging.ImageFormat]::Icon

$publicDir = Join-Path $PSScriptRoot "..\public"
$iconsDir = Join-Path $publicDir "icons"

# Standard Brand Icons
Resize-Image -Image $srcImg -Width 512 -Height 512 -DestinationPath (Join-Path $publicDir "brand-icon.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 512 -Height 512 -DestinationPath (Join-Path $publicDir "logo.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 180 -Height 180 -DestinationPath (Join-Path $publicDir "apple-touch-icon.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 192 -Height 192 -DestinationPath (Join-Path $publicDir "android-chrome-192x192.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 512 -Height 512 -DestinationPath (Join-Path $publicDir "android-chrome-512x512.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 16 -Height 16 -DestinationPath (Join-Path $publicDir "favicon-16x16.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 32 -Height 32 -DestinationPath (Join-Path $publicDir "favicon-32x32.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 32 -Height 32 -DestinationPath (Join-Path $publicDir "favicon.ico") -Format $pngFormat

# PWA icons
Resize-Image -Image $srcImg -Width 72 -Height 72 -DestinationPath (Join-Path $iconsDir "icon-72x72.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 96 -Height 96 -DestinationPath (Join-Path $iconsDir "icon-96x96.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 128 -Height 128 -DestinationPath (Join-Path $iconsDir "icon-128x128.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 144 -Height 144 -DestinationPath (Join-Path $iconsDir "icon-144x144.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 152 -Height 152 -DestinationPath (Join-Path $iconsDir "icon-152x152.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 192 -Height 192 -DestinationPath (Join-Path $iconsDir "icon-192x192.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 384 -Height 384 -DestinationPath (Join-Path $iconsDir "icon-384x384.png") -Format $pngFormat
Resize-Image -Image $srcImg -Width 512 -Height 512 -DestinationPath (Join-Path $iconsDir "icon-512x512.png") -Format $pngFormat

$srcImg.Dispose()
Write-Host "All icons generated successfully!"
