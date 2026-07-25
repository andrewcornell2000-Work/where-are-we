# Product

## Register

product

## Users

A solo founder or small-team builder working with an AI coding assistant, usually
deep in a terminal or editor. They open this board when they surface from the work
and need to answer one question: *where am I?* Often after a break, a context
switch, or on a different machine — so the board has to make sense cold, with no
re-reading.

The job to be done: see the state of a project in one glance, know what to do next
without deciding, and see that today produced something.

## Product Purpose

A live board that an AI keeps current as a side effect of doing the work. The AI
edits one file in the repo; the board redraws itself. The user never maintains it.

Success is that the board is *believed* — glanced at daily and trusted, rather than
tidied, ignored, or abandoned like every other project tracker. If the user has to
groom it, it has failed.

## Brand Personality

Hand-drawn, calm, credible.

The board should read like a thinking person's sketchbook: an architect's site
notes or a well-kept field notebook. Drawn by hand, but by someone who is good at
it and doing serious work. Warm and human, never cute.

Voice is plain and direct. Say what a thing does, not what it is called internally.
No cheerleading, no exclamation marks, no "Let's get productive!". The board states
facts about the project and gets out of the way.

## Anti-references

- **Generic SaaS dashboard.** Purple gradients, identical stat-card grids,
  glassmorphism, the template look. If it could be any B2B tool, it's wrong.
- **Childish / toy-like.** This is the sharpest risk, because the medium is
  literally crayon. The line is *hand-drawn by an adult, for adult work* —
  moleskine and drafting pencil, not primary-school poster paint. Wobble is
  character; bounce, rainbow palettes and cartoon stickers are not.
- **Cluttered whiteboard.** Miro/FigJam density — chrome, panels and affordances
  competing with the content. The canvas is the product; the UI around it should
  nearly disappear.
- **Cold and corporate.** Sterile enterprise grey with no personality. Removing the
  character to look "professional" is the wrong correction to the childish risk.

## Design Principles

1. **The board is the product; the chrome is not.** Every pixel of UI has to earn
   its place against the canvas it is covering. When in doubt, remove it.
2. **Answer "where am I?" in one glance.** Hierarchy serves that one question:
   what's done, what's next, what's blocked. Anything that doesn't serve it is
   decoration.
3. **Hand-drawn, not hand-made.** The wobble is deliberate; the spacing, colour and
   type behind it are not. Precision underneath, looseness on the surface — that is
   the whole trick, and it is what separates this from a toy.
4. **Quiet by default, loud only where it matters.** One thing at a time may
   shout — the next action. Everything else recedes. Highlighting the whole board
   highlights nothing.
5. **Readable cold.** Copy, labels and card text must make sense to someone who has
   forgotten the details, weeks later. No internal shorthand anywhere the user can
   see it.

## Accessibility & Inclusion

Solid defaults rather than a formal audit:

- Body text meets a readable contrast against its surface in both themes; the
  status labels and card titles are the priority since they carry the meaning.
- `prefers-reduced-motion` is honoured — the draw-in animation is the app's
  signature, so it must degrade to an instant, fully-visible state rather than
  being skipped in a way that leaves geometry hidden.
- Colour is never the only carrier of status: `done` / `in progress` / `to do` are
  always written out, not just implied by the crayon colour.
- Zoom is a first-class accessibility affordance here — level-of-detail rendering
  and the card-size control exist so the board stays legible without a screen
  magnifier.
