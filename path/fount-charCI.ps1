$CI_DIR = Split-Path -Parent $PSScriptRoot

$ErrorCount = $Error.Count

if ($PSEdition -eq "Desktop") {
	try { $IsWindows = $true } catch {}
}

if (!$IsWindows) {
	function install_package {
		param(
			[string]$CommandName,
			[string[]]$PackageNames
		)
		if ((Get-Command -Name $CommandName -ErrorAction Ignore)) { return $true }

		$hasSudo = (Get-Command -Name "sudo" -ErrorAction Ignore)

		foreach ($package in $PackageNames) {
			if (Get-Command -Name "apt-get" -ErrorAction Ignore) {
				if ($hasSudo) { sudo apt-get update -y > $null; sudo apt-get install -y $package }
				else { apt-get update -y > $null; apt-get install -y $package }
				if (Get-Command -Name $CommandName -ErrorAction Ignore) { break }
			}
			if (Get-Command -Name "pacman" -ErrorAction Ignore) {
				if ($hasSudo) { sudo pacman -Syy --noconfirm > $null; sudo pacman -S --needed --noconfirm $package }
				else { pacman -Syy --noconfirm > $null; pacman -S --needed --noconfirm $package }
				if (Get-Command -Name $CommandName -ErrorAction Ignore) { break }
			}
			if (Get-Command -Name "dnf" -ErrorAction Ignore) {
				if ($hasSudo) { sudo dnf install -y $package } else { dnf install -y $package }
				if (Get-Command -Name $CommandName -ErrorAction Ignore) { break }
			}
			if (Get-Command -Name "yum" -ErrorAction Ignore) {
				if ($hasSudo) { sudo yum install -y $package } else { yum install -y $package }
				if (Get-Command -Name $CommandName -ErrorAction Ignore) { break }
			}
			if (Get-Command -Name "zypper" -ErrorAction Ignore) {
				if ($hasSudo) { sudo zypper install -y --no-confirm $package } else { zypper install -y --no-confirm $package }
				if (Get-Command -Name $CommandName -ErrorAction Ignore) { break }
			}
			if (Get-Command -Name "apk" -ErrorAction Ignore) {
				if ($hasSudo) { sudo apk add --update $package } else { apk add --update $package }
				if (Get-Command -Name $CommandName -ErrorAction Ignore) { break }
			}
			if (Get-Command -Name "brew" -ErrorAction Ignore) {
				if (-not (brew list --formula $package -ErrorAction Ignore)) {
					brew install $package
				}
				if (Get-Command -Name $CommandName -ErrorAction Ignore) { break }
			}
			if (Get-Command -Name "pkg" -ErrorAction Ignore) {
				if ($hasSudo) { sudo pkg install -y $package } else { pkg install -y $package }
				if (Get-Command -Name $CommandName -ErrorAction Ignore) { break }
			}
			if (Get-Command -Name "snap" -ErrorAction Ignore) {
				if ($hasSudo) { sudo snap install $package } else { snap install $package }
				if (Get-Command -Name $CommandName -ErrorAction Ignore) { break }
			}
		}

		if (Get-Command -Name $CommandName -ErrorAction Ignore) {
			$currentPackages = $env:FOUNT_AUTO_INSTALLED_PACKAGES -split ';' | Where-Object { $_ }
			if ($package -notin $currentPackages) {
				$env:FOUNT_AUTO_INSTALLED_PACKAGES = ($currentPackages + $package) -join ';'
			}
			return $true
		}
		else {
			Write-Error "Error: $package installation failed."
			return $false
		}
	}
	install_package "bash" @("bash", "gnu-bash")
	bash $CI_DIR/path/fount-charCI.sh @args
	exit $LastExitCode
}

try {
	$FOUNT_DIR = Split-Path $(Split-Path $(Get-Command fount.ps1).Source -Parent) -Parent
} catch {}

if (!$FOUNT_DIR) {
	Write-Error "Error: Fount not found."
	exit 1
}

$Char_Dir = $args[0]
if (!$Char_Dir) {
	Write-Error "Error: Char_Dir not found, set as first argument or YOUR_FOUNT_USERNAME/CHAR_NAME."
	exit 1
}
if ($Char_Dir -match '^[^\/]+\/[^\/]+$') {
	$Char_Dir = $Char_Dir -split '/'
	$Char_Dir = "$FOUNT_DIR/data/users/$($Char_Dir[0])/chars/$($Char_Dir[1])"
}
$CharData = ConvertFrom-Json (Get-Content $Char_Dir/fount.json -Raw)
$CharDirName = $CharData.dirname

$FountVMdataDir = $FOUNT_DIR + '/.vm_data_charCI/'

New-Item -ItemType Junction -Path $FountVMdataDir -Target $CI_DIR/default_data/ -ErrorAction Ignore | Out-Null
New-Item -ItemType Directory -Path $FountVMdataDir/users/CI-user/chars -Force -ErrorAction Ignore | Out-Null
New-Item -ItemType Directory -Path $FountVMdataDir/users/CI-user/settings -Force -ErrorAction Ignore | Out-Null
New-Item -ItemType Junction -Path $FountVMdataDir/users/CI-user/chars/$CharDirName -Target $Char_Dir -ErrorAction Ignore | Out-Null
New-Item -ItemType Junction -Path $CI_DIR/fount -Target $FOUNT_DIR -ErrorAction Ignore | Out-Null
New-Item -ItemType Junction -Path $CI_DIR/node_modules -Target $FOUNT_DIR/node_modules -ErrorAction Ignore | Out-Null

$env:CI_username = 'CI-user'
$env:CI_charname = $CharDirName
$env:GITHUB_ACTION_PATH = $CI_DIR

$Char_CIfile = $CharData.'CI-file'
if (!$Char_CIfile) { $Char_CIfile = $args[1] }
if (!$Char_CIfile) {
	Write-Error "Error: Char_CIfile not found, set as second argument or in fount.json."
	exit 1
}

deno run --allow-scripts --allow-all -c "$FOUNT_DIR/deno.json" --v8-flags=--expose-gc $CI_DIR/index.mjs $Char_CIfile
exit $LastExitCode
