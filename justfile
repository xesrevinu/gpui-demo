# 显示可用的命令
default:
    @just --list

# 设置常用变量
app_name := "gpui-demo"
release_dir := "target/release"
bundle_dir := release_dir / app_name + ".app"

# 运行开发服务器
dev:
    cargo watch -x "run --package {{app_name}}"

# 运行测试
test *args:
    cargo test --workspace {{args}}

# 运行指定测试并观察输出
test-watch TEST:
    cargo watch -x "test --workspace {{TEST}}"

# 检查代码格式
fmt:
    cargo fmt --all -- --check

# 自动修复代码格式
fmt-fix:
    cargo fmt --all

# 运行 clippy
lint:
    cargo clippy --workspace -- -D warnings

# 自动修复 clippy 警告
lint-fix:
    cargo clippy --workspace --fix -- -D warnings

# 更新依赖
update: update-rust update-nix

# Rust 依赖更新
update-rust:
    cargo update
    @just audit

# Nix 依赖更新
update-nix:
    nix flake update

# 检查安全问题
audit:
    cargo audit
    cargo outdated

# 构建所有 crate
build:
    cargo build --workspace

# Release 版本
release:
    cargo build --release

# 检查所有 crate
check:
    cargo build --workspace --all-targets
    cargo check --workspace --all-targets --all-features

# 清理构建产物
clean:
    cargo clean
    rm -rf {{release_dir}}/*.app
    rm -rf {{release_dir}}/*.dmg

# 验证应用包
verify-bundle:
    #!/usr/bin/env bash
    echo "Verifying app bundle at {{bundle_dir}}..."
    
    # 检查基本结构
    test -d "{{bundle_dir}}" || { echo "App bundle not found"; exit 1; }
    test -f "{{bundle_dir}}/Contents/Info.plist" || { echo "Info.plist not found"; exit 1; }
    test -x "{{bundle_dir}}/Contents/MacOS/{{app_name}}" || { echo "Executable not found or not executable"; exit 1; }
    
    # 验证 Info.plist
    plutil -lint "{{bundle_dir}}/Contents/Info.plist" || { echo "Invalid Info.plist"; exit 1; }
    
    # 检查可执行文件
    codesign -dvv "{{bundle_dir}}" || echo "Warning: App is not signed"
    
    echo "Bundle verification completed"

# macOS 打包
bundle-mac: clean release
    @echo "Creating macOS bundle..."
    mkdir -p "{{bundle_dir}}/Contents/MacOS"
    mkdir -p "{{bundle_dir}}/Contents/Resources"
    cp "{{release_dir}}/{{app_name}}" "{{bundle_dir}}/Contents/MacOS/"
    cp "crates/app/resources/macos/Info.plist" "{{bundle_dir}}/Contents/"
    chmod +x "{{bundle_dir}}/Contents/MacOS/{{app_name}}"
    @echo "macOS bundle created at {{bundle_dir}}"

# 创建 DMG 镜像
create-dmg: bundle-mac verify-bundle
    @echo "Creating DMG..."
    hdiutil create -volname "{{app_name}}" \
        -srcfolder "{{bundle_dir}}" \
        -ov -format UDZO \
        "{{release_dir}}/{{app_name}}.dmg"
    @echo "DMG created at {{release_dir}}/{{app_name}}.dmg"

# Changeset 相关命令
changeset-add:
    @echo "Adding a new changeset..."
    pnpm changeset

changeset-status:
    @echo "Checking changeset status..."
    pnpm changeset status

versions-sync:
    @echo "Bumping versions..."
    # 同步版本到其他文件
    VERSION=$(node -p "require('./package.json').version")
    node scripts/sync-version.js $VERSION

# 验证所有版本文件一致性
verify-versions:
    #!/usr/bin/env bash
    PKG_VERSION=$(node -p "require('./package.json').version")
    CARGO_VERSION=$(grep '^version = ' Cargo.toml | cut -d '"' -f2)
    if [ "$PKG_VERSION" != "$CARGO_VERSION" ]; then
        echo "Version mismatch: package.json ($PKG_VERSION) != Cargo.toml ($CARGO_VERSION)"
        exit 1
    fi

# 私有命令（不显示在帮助中）
@_install-hooks:
    lefthook install