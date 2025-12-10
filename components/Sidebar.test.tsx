// Fix: Import Jest globals to resolve errors like "Cannot find name 'describe'".
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

// Fix: Use describe() which is now available.
describe('Sidebar', () => {
  // Fix: Use jest.fn() which is now available.
  const setView = jest.fn();
  const toggleTheme = jest.fn();

  // Fix: Use beforeEach() which is now available.
  beforeEach(() => {
    // Fix: Use jest.clearAllMocks() which is now available.
    jest.clearAllMocks();
  });

  // Fix: Use it() which is now available.
  it('renders all navigation items', () => {
    render(<Sidebar currentView="chat" setView={setView} theme="dark" toggleTheme={toggleTheme} />);
    
    // Fix: Use expect() which is now available.
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Business Canvas')).toBeInTheDocument();
    expect(screen.getByText('Financial Projections')).toBeInTheDocument();
  });

  // Fix: Use it() which is now available.
  it('highlights the current view', () => {
    render(<Sidebar currentView="canvas" setView={setView} theme="dark" toggleTheme={toggleTheme} />);
    
    const canvasButton = screen.getByText('Business Canvas').closest('button');
    const chatButton = screen.getByText('Chat').closest('button');

    // Fix: Use expect() which is now available.
    expect(canvasButton).toHaveClass('bg-brand-accent');
    expect(chatButton).not.toHaveClass('bg-brand-accent');
  });

  // Fix: Use it() which is now available.
  it('calls setView when a navigation item is clicked', () => {
    render(<Sidebar currentView="chat" setView={setView} theme="dark" toggleTheme={toggleTheme} />);
    
    fireEvent.click(screen.getByText('Financial Projections'));
    
    // Fix: Use expect() which is now available.
    expect(setView).toHaveBeenCalledWith('financial-projections');
    expect(setView).toHaveBeenCalledTimes(1);
  });

  // Fix: Use it() which is now available.
  it('calls toggleTheme when the theme button is clicked', () => {
    render(<Sidebar currentView="chat" setView={setView} theme="dark" toggleTheme={toggleTheme} />);
    
    fireEvent.click(screen.getByLabelText('Switch to light mode'));
    
    // Fix: Use expect() which is now available.
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  // Fix: Use it() which is now available.
  it('calls setView when settings is clicked', () => {
    render(<Sidebar currentView="chat" setView={setView} theme="dark" toggleTheme={toggleTheme} />);
    
    fireEvent.click(screen.getByText('Settings'));

    // Fix: Use expect() which is now available.
    expect(setView).toHaveBeenCalledWith('settings');
  });
});
