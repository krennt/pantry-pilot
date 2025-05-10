# Contributing to PantryPilot

Thank you for considering contributing to PantryPilot! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please create an issue in the GitHub repository with the following information:

- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment information (browser, OS, etc.)

### Suggesting Features

We welcome feature suggestions! Please create an issue with:

- A clear, descriptive title
- A detailed description of the proposed feature
- Any relevant mockups or examples
- Why this feature would be beneficial to the project

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Run tests and linting to ensure code quality
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature-name`)
7. Open a Pull Request

## Development Setup

Please refer to the README.md file for detailed setup instructions. Here's a quick overview:

1. Clone the repository
2. Run `npm run setup` to set up the project
3. Start the development server with `npm start`

## Coding Guidelines

### JavaScript/TypeScript

- Follow the ESLint configuration provided in the project
- Use TypeScript for type safety
- Write meaningful variable and function names
- Add comments for complex logic

### React

- Use functional components with hooks
- Keep components small and focused on a single responsibility
- Use the context API for state that needs to be shared across components
- Follow the file structure established in the project

### Firebase

- Follow Firebase security best practices
- Keep Firestore rules secure and well-tested
- Optimize database queries for performance

## Testing

- Write tests for new features and bug fixes
- Ensure all tests pass before submitting a pull request
- Aim for good test coverage

## Documentation

- Update documentation when adding or changing features
- Document functions, components, and complex logic
- Keep the README.md up to date

## Commit Messages

- Use clear, descriptive commit messages
- Start with a verb in the present tense (e.g., "Add", "Fix", "Update")
- Reference issue numbers when applicable

## Review Process

- All pull requests will be reviewed by maintainers
- Address any requested changes promptly
- Be open to feedback and suggestions

Thank you for contributing to PantryPilot!
