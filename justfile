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

# macOS 打包
bundle-mac:
    @echo "Creating macOS bundle..."
    mkdir -p "{{bundle_dir}}/Contents/MacOS"
    mkdir -p "{{bundle_dir}}/Contents/Resources"
    cp "{{release_dir}}/{{app_name}}" "{{bundle_dir}}/Contents/MacOS/"
    cp "crates/app/resources/macos/Info.plist" "{{bundle_dir}}/Contents/"
    chmod +x "{{bundle_dir}}/Contents/MacOS/{{app_name}}"
    @echo "macOS bundle created at {{bundle_dir}}"

# 验证应用包
mac-verify:
    @echo "Verifying app bundle at {{bundle_dir}}..."

    #!/usr/bin/env bash
    # 检查基本结构
    test -d "{{bundle_dir}}" || { echo "App bundle not found"; exit 1; }
    test -f "{{bundle_dir}}/Contents/Info.plist" || { echo "Info.plist not found"; exit 1; }
    test -x "{{bundle_dir}}/Contents/MacOS/{{app_name}}" || { echo "Executable not found or not executable"; exit 1; }
    
    # 验证 Info.plist
    plutil -lint "{{bundle_dir}}/Contents/Info.plist" || { echo "Invalid Info.plist"; exit 1; }
    
    # 检查可执行文件
    codesign -dvv "{{bundle_dir}}" || echo "Warning: App is not signed"
    
    echo "Bundle verification completed"

# 创建 DMG 镜像
mac-create-dmg: mac-verify
    @echo "Creating DMG..."
    hdiutil create -volname "{{app_name}}" \
        -srcfolder "{{bundle_dir}}" \
        -ov -format UDZO \
        "{{release_dir}}/{{app_name}}.dmg"
    @echo "DMG created at {{release_dir}}/{{app_name}}.dmg"

# 签名应用包
mac-sign:
    @echo "Signing app bundle..."
    #!/usr/bin/env bash
    node --experimental-strip-types ./scripts/mac-sign.ts

# Linux 打包
bundle-linux:
    @echo "Creating Linux bundle..."
    mkdir -p "{{bundle_dir}}/bin"
    cp "{{release_dir}}/{{app_name}}" "{{bundle_dir}}/bin/"
    @echo "Linux bundle created at {{bundle_dir}}"

# Linux 验证
linux-verify:
    @echo "Verifying Linux bundle..."
    test -d "{{bundle_dir}}" || { echo "Bundle not found"; exit 1; }
    test -f "{{bundle_dir}}/bin/{{app_name}}" || { echo "Executable not found"; exit 1; }
    @echo "Linux bundle verified"

# 验证所有版本文件一致性
verify-versions:
    @echo "Verifying versions..."
    #!/usr/bin/env bash
    node --experimental-strip-types ./scripts/verify-versions.ts

# Changeset 相关命令
changeset-add:
    @echo "Adding a new changeset..."
    pnpm changeset

changeset-status:
    @echo "Checking changeset status..."
    pnpm changeset status

# 生成新的版本号
changeset-version:
    @echo "Running changeset version..."
    pnpm changeset version

# 同步版本号到所有文件
versions-sync: changeset-version
    @echo "Syncing versions..."
    #!/usr/bin/env bash
    node --experimental-strip-types ./scripts/sync-version.ts

# 私有命令（不显示在帮助中）
@_install-hooks:
    lefthook install