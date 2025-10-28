import React, { ReactNode } from 'react';
import { Link } from 'wouter';

interface HeaderProps {
  children?: ReactNode;
}

export default function Header({ children }: HeaderProps) {
  return (
    <header data-testid="header" style={{ padding: '12px 16px' }}>
      {/* Branding */}
      <div style={{ fontWeight: 700, fontSize: 20, lineHeight: 1.2, marginBottom: 8 }}>
        <Link href="/" data-testid="brand-link" style={{ textDecoration: 'none' }}>
          ALL-SET MECHANICS
        </Link>
        <span data-testid="brand-tagline" style={{ display: 'block', fontWeight: 500, fontSize: 14 }}>
          across the Front Range
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/" data-testid="home-link">Home</Link>
        <Link href="/services" data-testid="services-link">Services</Link>
        <Link href="/about" data-testid="about-link">About</Link>
        <Link href="/contact" data-testid="contact-link">Contact</Link>
      </nav>

      {/* Anything you pass as children will render here */}
      {children}
    </header>
  );
}