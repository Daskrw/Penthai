# PCGA System Changelog

This changelog documents all structural changes, new tools, removed code, and the reasoning behind architectural decisions made during the development of the PCGA Assessment System.

## [v2.1.0] - Premium Redesign
**Date**: June 23, 2026

### 🎨 Aesthetic Overhaul
- **Changed**: Completely removed the dark-emerald gradient theme in favor of a minimalist, premium White, Red, Black, and Brown color palette.
  - *Reasoning*: To elevate the user experience and provide a more professional, highly readable interface that aligns with modern minimalist design trends.
- **Changed**: Replaced floating organic CSS shapes on the landing page with structured, geometric Framer Motion scroll animations (`fade-in`, `slide-up`).
  - *Reasoning*: To make the experience more dynamic and modern without being overly distracting or playful.
- **Changed**: Updated the SVG Radar Chart and progress bars on the result page to use Red/Brown accents instead of green.
- **Changed**: Updated Likert scale buttons on the quiz page from a multi-color gradient (amber to emerald) to a cohesive palette matching the new theme.

### 📝 System Verification
- **Verified**: The new question set provided via OCR was analyzed and found to **exactly match** the existing PCGA v2 database structure and scoring logic (20%, 15%, 20%, 15%, 15%, 15%). 
  - *Result*: No structural database or backend logic changes were required during this update.

## [v2.0.0] - Core Engine & Scoring Implementation
**Date**: June 22, 2026

### ✨ New Features
- **Added**: Weighted scoring engine out of 100 points based on the 6 PCGA dimensions.
- **Added**: 3-second mandatory countdown timer on the privacy policy modal.
- **Added**: Section-based pagination for the quiz engine (grouping questions by the 8 PCGA sections).
- **Added**: Pure SVG Radar Chart for dimension breakdown on the result page.

### 🏗️ Architectural Changes
- **Added**: `single_select` question type to the PostgreSQL `question_type` ENUM to support radio-button style questions in the general info section.
- **Added**: `weight_percent` column to `assessment_sections` table to drive the new weighted scoring model dynamically from the database.
- **Added**: `question_number` column to `assessment_questions` for clear labeling (e.g., "1.1", "1.2").
- **Removed**: Ability for admins to create or delete new forms.
  - *Reasoning*: The user explicitly requested that the system maintain only ONE master PCGA form to prevent fragmentation and confusion. The admin panel was structurally changed to a 3-tab layout focused purely on editing the master form.
- **Removed**: Old placeholder seed data.
  - *Reasoning*: Replaced entirely with the 36+ exact questions from the PCGA documentation to ensure the system is production-ready.

---
*Note: This file is strictly maintained to provide full transparency on architectural freedom and design choices.*
