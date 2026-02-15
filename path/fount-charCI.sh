#!/usr/bin/env bash

# 定义常量和路径
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
CI_DIR=$(dirname "$SCRIPT_DIR")

# 若是 Windows 环境，则使用 fount.ps1
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
	powershell.exe -noprofile -executionpolicy bypass -file "$CI_DIR\path\fount-charCI.ps1" "$@"
	exit $?
fi

# 初始化自动安装的包列表
FOUNT_AUTO_INSTALLED_PACKAGES="${FOUNT_AUTO_INSTALLED_PACKAGES:-}"

# 辅助函数: 智能地使用包管理器进行安装 (包含更新逻辑)
install_with_manager() {
	local manager_cmd="$1"
	local package_to_install="$2"
	local update_args=""
	local install_args=""
	local has_sudo=""

	if ! command -v "$manager_cmd" &>/dev/null; then
		return 1
	fi

	if [[ $(id -u) -ne 0 ]] && command -v sudo &>/dev/null; then
		has_sudo="sudo"
	fi

	case "$manager_cmd" in
	"apt-get")
		update_args="update -y"
		install_args="install -y"
		;;
	"pacman")
		update_args="-Syy --noconfirm"
		install_args="-S --needed --noconfirm"
		;;
	"dnf")
		update_args="makecache"
		install_args="install -y"
		;;
	"yum")
		update_args="makecache fast"
		install_args="install -y"
		;;
	"zypper")
		update_args="refresh"
		install_args="install -y --no-confirm"
		;;
	"pkg")
		update_args="update -y"
		install_args="install -y"
		;;
	"apk") install_args="add --update" ;;
	"brew")
		has_sudo=""
		install_args="install"
		;;
	"snap")
		has_sudo="sudo"
		install_args="install"
		;;
	*) return 1 ;;
	esac

	if [[ -n "$update_args" ]]; then
		# shellcheck disable=SC2086
		$has_sudo "$manager_cmd" $update_args
	fi
	# shellcheck disable=SC2086
	$has_sudo "$manager_cmd" $install_args "$package_to_install"
}

# 函数: 安装包 (高效、健壮版)
install_package() {
	local command_name="$1"
	local package_list_str="${2:-$command_name}"
	local package_list=($package_list_str)
	local installed_pkg_name=""

	if command -v "$command_name" &>/dev/null; then
		return 0
	fi

	for package in "${package_list[@]}"; do
		if
			install_with_manager "pkg" "$package" ||
				install_with_manager "apt-get" "$package" ||
				install_with_manager "pacman" "$package" ||
				install_with_manager "dnf" "$package" ||
				install_with_manager "yum" "$package" ||
				install_with_manager "zypper" "$package" ||
				install_with_manager "apk" "$package" ||
				install_with_manager "brew" "$package" ||
				install_with_manager "snap" "$package"
		then
			if command -v "$command_name" &>/dev/null; then
				installed_pkg_name="$package"
				break
			fi
		fi
	done

	if command -v "$command_name" &>/dev/null; then
		# 跟踪自动安装的包
		case ";$FOUNT_AUTO_INSTALLED_PACKAGES;" in
		*";$installed_pkg_name;"*) ;; # Already tracked
		*)
			if [ -z "$FOUNT_AUTO_INSTALLED_PACKAGES" ]; then
				FOUNT_AUTO_INSTALLED_PACKAGES="$installed_pkg_name"
			else
				FOUNT_AUTO_INSTALLED_PACKAGES="$FOUNT_AUTO_INSTALLED_PACKAGES;$installed_pkg_name"
			fi
			;;
		esac
		return 0
	else
		echo "Error: Failed to install '$command_name' using any known package manager." >&2
		return 1
	fi
}

# 检查并安装依赖
install_package "jq" "jq"

# --- 主逻辑 ---

# 通过 `fount.ps1` 命令的位置找到 FOUNT_DIR
FOUNT_SH_PATH=""
if ! FOUNT_SH_PATH=$(command -v fount.sh); then
	echo "Error: 'fount.sh' command not found" >&2
	exit 1
fi

# 获取 `fount.ps1` 的真实路径（处理符号链接），然后取其父目录的父目录
FOUNT_SH_REAL_PATH=$(realpath "$FOUNT_SH_PATH")
FOUNT_DIR=$(dirname "$(dirname "$FOUNT_SH_REAL_PATH")")

if [[ ! -d "$FOUNT_DIR" ]]; then
	echo "Error: Fount directory not found" >&2
	exit 1
fi

# 从第一个参数获取 Char_Dir
Char_Dir="${1:-}"
if [[ -z "$Char_Dir" ]]; then
	echo "Error: Char_Dir is empty, please provide it as the first argument or YOUR_FOUNT_USERNAME/CHAR_NAME" >&2
	exit 1
fi

# 如果 Char_Dir 是 "user/char" 格式，则解析为完整路径
if [[ "$Char_Dir" =~ ^[^/]+/[^/]+$ ]]; then
	user="${Char_Dir%%/*}"
	char="${Char_Dir#*/}"
	Char_Dir="$FOUNT_DIR/data/users/$user/chars/$char"
fi

# 检查角色目录和 fount.json 文件是否存在
if [[ ! -d "$Char_Dir" ]]; then
	echo "Error: Char_Dir '$Char_Dir' does not exist" >&2
	exit 1
fi
FOUNT_JSON_PATH="$Char_Dir/fount.json"
if [[ ! -f "$FOUNT_JSON_PATH" ]]; then
	echo "Error: Fount JSON file '$FOUNT_JSON_PATH' not found" >&2
	exit 1
fi

# 使用 jq 解析 fount.json 以获取 dirname
CharDirName=$(jq -r '.dirname' "$FOUNT_JSON_PATH")
if [[ -z "$CharDirName" || "$CharDirName" == "null" ]]; then
	echo "Error: Failed to get dirname from fount.json" >&2
	exit 1
fi

# 创建 CI 所需的数据目录和符号链接
FountVMdataDir="$FOUNT_DIR/.vm_data_charCI/"
mkdir -p "$FountVMdataDir"
# 使用 ln -sfn 创建/更新符号链接，-f (force) -n (no-dereference)
ln -sfn "$CI_DIR/default_data/" "$FountVMdataDir"
mkdir -p "$FountVMdataDir/users/CI-user/chars"
mkdir -p "$FountVMdataDir/users/CI-user/settings"
ln -sfn "$Char_Dir" "$FountVMdataDir/users/CI-user/chars/$CharDirName"
ln -sfn "$FOUNT_DIR" "$CI_DIR/fount"
ln -sfn "$FOUNT_DIR/node_modules" "$CI_DIR/node_modules"

# 为 deno 脚本导出环境变量
export CI_username='CI-user'
export CI_charname="$CharDirName"
export GITHUB_ACTION_PATH="$CI_DIR"

# 确定要运行的 CI 文件
# jq 的 ' // empty ' 在键不存在时返回空字符串而不是 "null"
Char_CIfile=$(jq -r '."CI-file" // empty' "$FOUNT_JSON_PATH")
if [[ -z "$Char_CIfile" ]]; then
	Char_CIfile="${2:-}"
fi
if [[ -z "$Char_CIfile" ]]; then
	echo "Error: Char_CIfile is empty, please provide it as the second argument or in fount.json" >&2
	exit 1
fi

deno run --allow-scripts --allow-all --unstable-npm-lazy-caching -c "$FOUNT_DIR/deno.json" --v8-flags=--expose-gc "$CI_DIR/index.mjs" "$Char_CIfile"
exit $?
