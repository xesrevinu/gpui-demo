# Contributing to GPUI Demo

## Development Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and lints:
```bash
just test
just fmt
just lint
```
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Environment

We use Nix for development environment management:

```bash
# Enter development environment
nix develop

# Common development commands
just dev    # Run development server
just test   # Run tests
just fmt    # Format code
just lint   # Run linter
```

## Code Style

- Follow Rust standard formatting (enforced by `rustfmt`)
- Use meaningful variable and function names
- Write documentation for public APIs
- Add tests for new features 