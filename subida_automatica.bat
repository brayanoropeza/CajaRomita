@echo off
title Subir Cambios de Caja Romita a GitHub y Compilar APK
color 0A
echo ===================================================
echo     SUBIENDO CAMBIOS A GITHUB (WEB + APK ANDROID)
echo ===================================================
echo.

cd /d "C:\Users\JESUS 2\Documents\negocio"

echo [1/3] Guardando cambios y respaldando en la carpeta del proyecto...
powershell -Command "Copy-Item -Path 'C:\Users\JESUS 2\Documents\negocio\*' -Destination 'C:\Users\JESUS 2\Documents\proyecto\Triptico\' -Recurse -Force"

echo [2/3] Preparando envio de archivos a GitHub...
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Actualizacion automatica de Caja Romita %date% %time%"

echo [3/3] Subiendo a la nube de GitHub...
"C:\Program Files\Git\cmd\git.exe" push origin main

echo.
echo ===================================================
echo   ¡LISTO! Cambios subidos correctamente.
echo   La Web y el APK de Android se estan actualizando
echo   en tu repositorio de GitHub automaticamente.
echo ===================================================
echo.
pause
