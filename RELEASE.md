# Release Checklist

## 准备工作
- [ ] 确保所有测试通过 (`just test`)
- [ ] 确保代码格式正确 (`just fmt`)
- [ ] 确保没有 clippy 警告 (`just lint`)
- [ ] 检查依赖安全问题 (`just audit`)
- [ ] 更新版本号
  - [ ] Cargo.toml
  - [ ] Info.plist

## 构建和验证
- [ ] 清理旧的构建产物 (`just clean`)
- [ ] 构建发布版本 (`just release`)
- [ ] 创建应用包 (`just bundle-mac`)
- [ ] 验证应用包 (`just verify-bundle`)
- [ ] 测试运行应用包
  ```bash
  open target/release/gpui-demo.app
  ```

## 发布
- [ ] 创建 git tag
  ```bash
  git tag -a v0.1.0 -m "Release v0.1.0"
  git push origin v0.1.0
  ```
- [ ] 等待 GitHub Actions 完成
- [ ] 验证 GitHub Release 页面
- [ ] 测试下载的发布包

## 发布后
- [ ] 更新开发版本号
- [ ] 通知相关团队
- [ ] 更新文档 