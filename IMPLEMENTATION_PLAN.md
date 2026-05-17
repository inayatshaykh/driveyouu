# Implementation Plan - Premium Dark Theme & Category Car Selection

## Date: May 17, 2026

This document outlines the changes needed for the premium dark theme and category-based car selection.

## TASK 1: Booking Form - Category-Based Car Selection

### Current State:
- Flat 2x2 grid showing 4 cars
- Direct car selection

### Target State:
- Step 1: Category tabs (Hatchback, Sedan, MPV, SUV, Premium)
- Step 2: Vertical list of cars for selected category
- Default: MPV category selected

### Implementation:
1. Add `selectedCategory` state (default: 'MPV')
2. Replace DEMO_CARS array with CARS_BY_CATEGORY object
3. Replace car grid with:
   - Horizontal scrollable category pills
   - Vertical car list filtered by category
4. Add "Most Popular" badge to Ertiga and Honda City

## TASK 2: Landing Page - Premium Dark Theme

### Color Replacements:
- `bg-yellow-400` → `bg-amber-500`
- `text-yellow-400` → `text-amber-400`
- `hover:bg-yellow-300` → `hover:bg-amber-400`

### Section Updates:
1. **Hero**: `bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950`
2. **Stats Bar**: `bg-slate-800 border-t border-b border-slate-700`
3. **Premium Services**: Keep `bg-slate-900`, change yellow to amber
4. **Tailored Services**: `bg-slate-800` (was white)
5. **How It Works**: `bg-slate-900`, cards `bg-slate-800`
6. **Why Choose Us**: `bg-slate-800`, cards `bg-slate-900/60`
7. **Footer**: `bg-slate-950`

## TASK 3: Navbar Updates

### Desktop:
- Add Login/Sign Up button (right side)
- Style: `border-2 border-amber-500 text-amber-500`

### Mobile:
- Replace hamburger with 3-dot menu (⋮)
- Dropdown from top-right
- Style: `bg-slate-800 rounded-2xl`

### Navbar Base:
- `bg-slate-900/95 backdrop-blur-md border-b border-slate-800`

## Files to Modify:
1. `src/components/customer/NewBookingForm.tsx`
2. `src/routes/index.tsx`

## Status: READY FOR IMPLEMENTATION
