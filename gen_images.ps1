Add-Type -AssemblyName System.Drawing

$out = "E:\fashion-men\uploads"
if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

function New-ProductImage {
    param(
        [string]$Filename,
        [string]$Label,
        [string]$BgTop,
        [string]$BgBottom,
        [string]$Accent,
        [string]$TextColor
    )
    $w = 700; $h = 700
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = "AntiAlias"
    $g.TextRenderingHint = "AntiAliasGridFit"

    # Vertical gradient background
    $rect = New-Object System.Drawing.Rectangle(0,0,$w,$h)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.ColorTranslator]::FromHtml($BgTop),
        [System.Drawing.ColorTranslator]::FromHtml($BgBottom),
        90)
    $g.FillRectangle($brush, $rect)

    # Subtle diagonal stripes overlay (light)
    $stripe = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(14,255,255,255))
    for ($x = -$h; $x -lt $w; $x += 50) {
        $pts = @(
            (New-Object System.Drawing.Point($x, 0)),
            (New-Object System.Drawing.Point(($x+25), 0)),
            (New-Object System.Drawing.Point(($x+25+$h), $h)),
            (New-Object System.Drawing.Point(($x+$h), $h))
        )
        $g.FillPolygon($stripe, $pts)
    }

    # Rounded inner panel (lighter) for product canvas
    $panel = New-Object System.Drawing.Rectangle(40,40,($w-80),($h-80))
    $panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36,255,255,255))
    # draw rounded rect via path
    $pathBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40,255,255,255))
    $radius = 24
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = ($radius*2)
    $path.AddArc($panel.X, $panel.Y, $d, $d, 180, 90)
    $path.AddArc($panel.Right-$d, $panel.Y, $d, $d, 270, 90)
    $path.AddArc($panel.Right-$d, $panel.Bottom-$d, $d, $d, 0, 90)
    $path.AddArc($panel.X, $panel.Bottom-$d, $d, $d, 90, 90)
    $path.CloseFigure()
    $g.FillPath($pathBrush, $path)

    # Accent badge bar at top of panel
    $badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($Accent))
    $badge = New-Object System.Drawing.Rectangle(64, 64, ($w-128), 40)
    $g.FillRectangle($badgeBrush, $badge)
    $badgeText = "FashionMen"
    $f = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
    $tb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = "Center"
    $fmt.LineAlignment = "Center"
    $badgeF = New-Object System.Drawing.RectangleF($badge.X, $badge.Y, $badge.Width, $badge.Height)
    $g.DrawString($badgeText, $f, $tb, $badgeF, $fmt)

    # Product name (wrapped, centered)
    $nameFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($TextColor))
    $textRect = New-Object System.Drawing.Rectangle(60, 340, ($w-120), 240)
    $fmt2 = New-Object System.Drawing.StringFormat
    $fmt2.Alignment = "Center"
    $fmt2.LineAlignment = "Center"
    $textRectF = New-Object System.Drawing.RectangleF($textRect.X, $textRect.Y, $textRect.Width, $textRect.Height)
    $g.DrawString($Label, $nameFont, $textBrush, $textRectF, $fmt2)

    # Footer caption
    $footRect = New-Object System.Drawing.Rectangle(0, ($h-70), $w, 50)
    $footFont = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Regular)
    $footBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200,255,255,255))
    $fmt3 = New-Object System.Drawing.StringFormat
    $fmt3.Alignment = "Center"
    $footRectF = New-Object System.Drawing.RectangleF($footRect.X, $footRect.Y, $footRect.Width, $footRect.Height)
    $g.DrawString("Premium Quality  ~  PKR", $footFont, $footBrush, $footRectF, $fmt3)

    $pathFile = Join-Path $out $Filename
    $bmp.Save($pathFile, [System.Drawing.Imaging.ImageFormat]::Jpeg)

    $bmp.Dispose(); $g.Dispose()
    Write-Host "wrote $Filename"
}

New-ProductImage -Filename "shirt-white-1.jpg" -Label "Classic White Formal Shirt" -BgTop "#efece6" -BgBottom "#cfc4b4" -Accent "#8f6a4b" -TextColor "#3a332e"
New-ProductImage -Filename "polo-black-1.jpg"  -Label "Premium Cotton Polo T-Shirt" -BgTop "#3a3631" -BgBottom "#141211" -Accent "#8f6a4b" -TextColor "#f4f1ec"
New-ProductImage -Filename "jeans-slim-1.jpg"  -Label "Slim Fit Stretch Jeans" -BgTop "#3c5476" -BgBottom "#182033" -Accent "#c8a87c" -TextColor "#eef1f6"

Write-Host "All images generated."