Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Configuración
$AppName = "Pillar - Punto de Venta"
$AppFolder = "Pillar"
$InstallPath = "$env:LOCALAPPDATA\$AppFolder"
$SourcePath = "$PSScriptRoot\app"

# 1. Bienvenida
[System.Windows.Forms.MessageBox]::Show("Bienvenido al Asistente de Instalación de $AppName.`n`nEste asistente instalará el software en su equipo y creará los accesos directos necesarios.", "Instalador Pillar", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)

# 2. Instalación (Copia de archivos)
Write-Host "Instalando..."
if (!(Test-Path $InstallPath)) { New-Item -ItemType Directory -Path $InstallPath -Force }
robocopy $SourcePath $InstallPath /E /R:1 /W:1 /MT

# 3. Registro y Atajos
$s = New-Object -ComObject WScript.Shell
$d = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'Pillar.lnk')
$shortcut = $s.CreateShortcut($d)
$shortcut.TargetPath = "$InstallPath\pillar.exe"
$shortcut.WorkingDirectory = "$InstallPath"
$shortcut.Save()

# Registro en Panel de Control
$RegistryPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\PillarPOS"
if (!(Test-Path $RegistryPath)) { New-Item -Path $RegistryPath -Force }
Set-ItemProperty -Path $RegistryPath -Name "DisplayName" -Value "$AppName"
Set-ItemProperty -Path $RegistryPath -Name "DisplayIcon" -Value "$InstallPath\pillar.exe"
Set-ItemProperty -Path $RegistryPath -Name "DisplayVersion" -Value "1.0.0"
Set-ItemProperty -Path $RegistryPath -Name "Publisher" -Value "Pillar Soft"
Set-ItemProperty -Path $RegistryPath -Name "UninstallString" -Value "powershell.exe -Command Remove-Item -Path $RegistryPath -Force; Remove-Item -Path $env:USERPROFILE\Desktop\Pillar.lnk -Force; Remove-Item -Path $env:LOCALAPPDATA\$AppFolder -Recurse -Force; [System.Windows.Forms.MessageBox]::Show('Desinstalación completada.')"
Set-ItemProperty -Path $RegistryPath -Name "InstallLocation" -Value "$InstallPath"

# 4. Finalización
[System.Windows.Forms.MessageBox]::Show("¡Instalación completada!`n`n$AppName ya está listo para usarse. Encontrará el acceso directo en su Escritorio.", "Instalador Pillar", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
