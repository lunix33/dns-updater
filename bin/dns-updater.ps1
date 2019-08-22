$pdir = Resolve-Path $PSScriptRoot\..
node --experimental-modules $pdir\main.js $args
