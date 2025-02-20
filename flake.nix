{
  description = "A Rust project using Nix Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils.url = "github:numtide/flake-utils";
    crane = {
      url = "github:ipetkov/crane";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, rust-overlay, flake-utils, crane, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };
        
        # 使用指定版本的 Rust，与 rust-toolchain.toml 保持一致
        rustToolchain = (pkgs.rust-bin.stable."1.81.0".default.override {
          targets = [];
          extensions = [
            # rust-toolchain.toml 中定义的组件
            "rustfmt"
            "clippy"
            "rust-analyzer"
            # Nix 环境额外需要的组件
            "rust-src"
          ];
        }).overrideAttrs (old: {
          # 设置 minimal profile
          meta = (old.meta or {}) // {
            mainProgram = "cargo";
          };
        });
        
        craneLib = crane.lib.${system};

        # 定义构建依赖
        buildDeps = with pkgs; [
          clang
          cmake
          curl
          perl
          pkg-config
          protobuf
          rustPlatform.bindgenHook
          
          # 基础依赖
          bzip2
          fontconfig
          freetype
          libgit2
          openssl
          sqlite
          stdenv.cc.cc
          zlib
          zstd
          lefthook
          
          nodejs_23
          icu 
        ] ++ lib.optionals stdenv.isDarwin [
          # macOS 特定依赖
          darwin.apple_sdk.frameworks.Metal
          darwin.apple_sdk.frameworks.Foundation
          darwin.apple_sdk.frameworks.AppKit
          darwin.apple_sdk.frameworks.CoreGraphics
          darwin.apple_sdk.frameworks.CoreServices
          darwin.apple_sdk.frameworks.CoreText
          darwin.apple_sdk.frameworks.Security
        ] ++ lib.optionals stdenv.isLinux [
          # Linux 特定依赖
          alsa-lib
          libxkbcommon
          wayland
          xorg.libxcb
          vulkan-loader
          mold
        ];

        # 定义开发依赖
        devDeps = with pkgs; [
          # Rust 工具链
          rustToolchain
          
          # 开发工具
          cargo-watch
          cargo-audit
          cargo-outdated
          just
          nixpkgs-fmt
          pre-commit
        ];

        commonEnv = {
          PROTOC = "${pkgs.protobuf}/bin/protoc";
          ZSTD_SYS_USE_PKG_CONFIG = true;
          FONTCONFIG_FILE = pkgs.makeFontsConf {
            fontDirectories = [
              "./assets/fonts"
            ];
          };
        };

        darwinEnv = pkgs.lib.optionalAttrs pkgs.stdenv.isDarwin {
          # 使用系统的 Xcode
          SDKROOT = "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk";
          DEVELOPER_DIR = "/Applications/Xcode.app/Contents/Developer";
          
          # Metal 相关配置
          METAL_SDK_PATH = "${pkgs.darwin.apple_sdk.frameworks.Metal}/Library/Frameworks/Metal.framework";
        };

      in
      {
        devShells.default = pkgs.mkShell ({
          # 合并构建依赖和开发依赖
          buildInputs = buildDeps ++ devDeps;

          inherit (commonEnv) PROTOC ZSTD_SYS_USE_PKG_CONFIG FONTCONFIG_FILE;

          # macOS 特定环境变量
          shellHook = pkgs.lib.optionalString pkgs.stdenv.isDarwin ''
            export SDKROOT="/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk"
            export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
            export METAL_SDK_PATH="${pkgs.darwin.apple_sdk.frameworks.Metal}/Library/Frameworks/Metal.framework"
            export RUST_SRC_PATH="${rustToolchain}/lib/rustlib/src/rust/library"
          '';
        } // darwinEnv);

        packages.default = craneLib.buildPackage ({
          src = ./.;
          buildInputs = buildDeps;
          cargoExtraArgs = "--workspace";
        } // commonEnv // darwinEnv);
      }
    );
} 