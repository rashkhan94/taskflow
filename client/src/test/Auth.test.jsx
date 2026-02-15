import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage.jsx';
import SignupPage from '../pages/SignupPage.jsx';

// Mock AuthContext
import { vi } from 'vitest';
vi.mock('../context/AuthContext.jsx', () => ({
    useAuth: () => ({
        user: null,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
        loading: false,
    }),
}));

describe('LoginPage', () => {
    it('renders login form', () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('has link to signup page', () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });
});

describe('SignupPage', () => {
    it('renders signup form', () => {
        render(
            <BrowserRouter>
                <SignupPage />
            </BrowserRouter>
        );
        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('has link to login page', () => {
        render(
            <BrowserRouter>
                <SignupPage />
            </BrowserRouter>
        );
        expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
});
