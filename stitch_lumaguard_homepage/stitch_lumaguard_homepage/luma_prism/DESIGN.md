# Design System Specification: The Luminous Laboratory

## 1. Overview & Creative North Star
This design system is built to transform a technical utility—window film—into a premium, atmospheric experience. We are moving away from the "industrial warehouse" aesthetic toward a **Creative North Star** we call **"The Digital Observatory."**

The objective is to evoke the feeling of looking through high-end glass: clarity, protection, and a sophisticated filtration of light. We achieve this by breaking the rigid, "boxed-in" grid of traditional Material Design in favor of **intentional asymmetry** and **tonal depth**. By utilizing expansive white space (the "light") and deep blue accents (the "shade"), we create a UI that feels as advanced and protective as the product itself.

---

## 2. Colors: Tonal Atmosphere
Our palette isn't just a set of hex codes; it’s a lighting strategy. We favor background-driven separation over structural lines.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. High-end design is felt, not outlined. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` (#f3f4f5) section should sit directly against a `surface` (#f8f9fa) background. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of precision-cut glass. 
- **Base Layer:** `surface` (#f8f9fa)
- **Secondary Content Areas:** `surface-container-low` (#f3f4f5)
- **Elevated Interactive Cards:** `surface-container-lowest` (#ffffff)
- **Deep Insets (Search/Inputs):** `surface-container-high` (#e7e8e9)

### The "Glass & Gradient" Rule
To evoke the brand’s core product, use **Glassmorphism** for floating navigation or overlays. Use `surface` colors at 70% opacity with a `backdrop-blur` of 20px. 
**Signature Textures:** Apply a subtle linear gradient (from `primary` #004692 to `primary_container` #275fae) at a 135-degree angle for hero CTAs to give them a "polarized" depth that flat color cannot replicate.

---

## 3. Typography: Editorial Precision
We utilize a pairing of **Manrope** for structural authority and **Inter** for technical clarity.

*   **Display & Headlines (Manrope):** These are our "Editorial" voices. Use `display-lg` (3.5rem) with tight tracking (-0.02em) to create a bold, tech-forward statement. 
*   **Body & Labels (Inter):** These represent "Technical Truth." Inter’s high x-height ensures readability at small scales. 
*   **Hierarchy Tip:** Use `tertiary` (#743800) sparingly for small caps `label-md` to highlight premium features or "New" badges—this warm orange provides the perfect high-contrast "spark" against the cool blue palette.

---

## 4. Elevation & Depth: The Layering Principle
We reject the heavy drop shadows of the 2010s. Depth is achieved through **Tonal Layering**.

*   **Ambient Shadows:** If a component *must* float (e.g., a modal), use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(25, 28, 29, 0.04)`. The color is a tinted version of `on-surface`, making it feel like a natural light obstruction rather than a "dark glow."
*   **The Ghost Border Fallback:** If accessibility requires a stroke (e.g., in high-contrast modes), use `outline_variant` (#c2c6d4) at 15% opacity. It should be barely perceptible.
*   **Soft Roundedness:** Follow the scale religiously. Use `xl` (1.5rem) for large containers to mimic the "soft tech" look of Google Labs, and `md` (0.75rem) for interactive elements like buttons.

---

## 5. Components: Refined Primitives

### Buttons
*   **Primary CTA:** Use `tertiary_container` (#984b00) with `on_tertiary` (#ffffff). Apply a `3.5` (1.2rem) horizontal padding. These should feel like a "warm sun" against the "cool glass" of the UI.
*   **Secondary:** Use `primary` (#004692) but as a "Ghost" style—transparent background with a 1.5px stroke of `outline_variant` at 20%.

### Cards & Lists
*   **The Divider Forbiddance:** Never use `<hr>` tags or border-bottoms. Use the Spacing Scale (e.g., `8` / 2.75rem) to let content breathe. If separation is needed, shift the background from `surface-container-lowest` to `surface-container-low`.

### Input Fields
*   **Modern State:** Inputs should use `surface_container_high` (#e7e8e9) with a `none` border. On focus, transition the background to `surface_container_lowest` (#ffffff) and apply a subtle 2px soft glow of `primary_fixed_dim`.

### Signature Component: The "Filter Preview"
Given the brand, create a custom "Glass Slider" component. A split-pane view using `xl` corner radius where the user slides a `primary` vertical line to see the "Tinted" vs. "Clear" state.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** embrace asymmetry. Align a headline to the left and a CTA to the far right with a `24` (8.5rem) gap.
*   **Do** use `primary_fixed` (#d7e2ff) for large background washes behind dark `primary` text to create a "blueprint" aesthetic.
*   **Do** use `6` (2rem) as your default "gutter" for content to ensure the "premium" feel of ample whitespace.

### Don’t:
*   **Don't** use pure black (#000000). Always use `on_surface` (#191c1d) to keep the contrast professional but soft.
*   **Don't** use standard Material "elevated" shadows. If it doesn't look like it's made of light and glass, it doesn't belong.
*   **Don't** cram information. If a section feels "busy," double the spacing using the `16` or `20` tokens.