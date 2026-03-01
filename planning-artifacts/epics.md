---
stepsCompleted:
  - "step-01-validate-prerequisites.md"
  - "step-02-design-epics.md"
  - "step-03-create-stories.md"
  - "step-04-final-validation.md"
inputDocuments:
  - "planning-artifacts/prd.md"
  - "planning-artifacts/architecture.md"
  - "planning-artifacts/project-context.md"
  - "planning-artifacts/ux-design-specification.md"
workflowType: "epics"
status: "complete"
lastStep: 4
completedAt: "2026-03-01"
---

# DigyNotes - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for DigyNotes, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories for the next structured improvement cycle of the brownfield product.

## Requirements Inventory

### Functional Requirements

- FR-01 Account and Identity
- FR-02 Personal Notes
- FR-03 Category and Tagging
- FR-04 Media Enrichment
- FR-05 Social Graph
- FR-06 Community Interaction
- FR-07 Discovery and Recommendation
- FR-08 Organization Layer
- FR-09 Insights and Review
- FR-10 Search and Filtering
- FR-11 Public Web Surface
- FR-12 Admin and Operations

### NonFunctional Requirements

- NFR-01 Security
- NFR-02 Data Integrity
- NFR-03 Performance
- NFR-04 UX Consistency
- NFR-05 Maintainability
- NFR-06 Deployability
- NFR-07 Accessibility and Reach

### Additional Requirements

- Brownfield-safe evolution with no disruptive rewrites
- Alignment with existing App Router, Prisma, NextAuth, and category normalization rules
- Mobile-first composer and dense-but-calm UX direction from the UX specification
- Explicit handling of limited automated test coverage during implementation

### FR Coverage Map

| Requirement | Covered In |
| --- | --- |
| FR-01 | Epic 1, Epic 4 |
| FR-02 | Epic 1 |
| FR-03 | Epic 1, Epic 2 |
| FR-04 | Epic 1 |
| FR-05 | Epic 3 |
| FR-06 | Epic 3 |
| FR-07 | Epic 3 |
| FR-08 | Epic 2 |
| FR-09 | Epic 2 |
| FR-10 | Epic 1, Epic 2 |
| FR-11 | Epic 2, Epic 3 |
| FR-12 | Epic 4 |
| NFR-01 | Epic 4 |
| NFR-02 | Epic 1, Epic 4 |
| NFR-03 | Epic 1, Epic 2, Epic 3 |
| NFR-04 | Epic 1, Epic 2, Epic 3 |
| NFR-05 | Epic 4 |
| NFR-06 | Epic 4 |
| NFR-07 | Epic 1, Epic 2, Epic 3 |

## Epic List

1. Epic 1: Faster and Safer Note Capture
2. Epic 2: Stronger Personal Library and Recall
3. Epic 3: Clearer Discovery and Social Confidence
4. Epic 4: Safer Operations and Product Trust

## Epic 1: Faster and Safer Note Capture

Make it easier for users to create, edit, enrich, and safely save notes across all supported media categories without losing structure or momentum.

### Story 1.1: Guided note composer entry

As a returning user,  
I want the new note screen to clearly guide my first actions,  
So that I can start capturing a note without hesitation.

**Acceptance Criteria:**

**Given** I open the new note page  
**When** the screen renders on mobile or desktop  
**Then** the page shows a clear primary capture flow with category, search, title, and status in an obvious order  
**And** the first meaningful action is visually prominent.

**Given** I switch categories  
**When** the form updates for that category  
**Then** only relevant metadata fields remain visible  
**And** irrelevant fields are removed or reset predictably.

**Given** I am entering a note for the first time  
**When** I see empty or helper states  
**Then** the copy explains what to do next in Turkish  
**And** the UI never feels like a generic admin form.

### Story 1.2: Reliable edit flow with unsaved-change protection

As a user editing an existing note,  
I want the edit experience to behave consistently and warn me before losing changes,  
So that I can safely refine my archive.

**Acceptance Criteria:**

**Given** I modify a note and try to leave the page  
**When** there are unsaved changes  
**Then** I receive a clear warning before navigation completes.

**Given** I edit metadata, tags, spoiler state, or content  
**When** I save  
**Then** all changed fields persist together  
**And** the detail screen reflects the updated values.

**Given** a save fails due to auth or request errors  
**When** the response returns  
**Then** I receive both inline and toast feedback  
**And** I can recover without losing my current form state.

### Story 1.3: Category-aware media enrichment

As a user adding media-based notes,  
I want search results and autofill to reflect the selected category,  
So that I can capture accurate information with minimal typing.

**Acceptance Criteria:**

**Given** I search for film, series, game, book, or travel content  
**When** results appear  
**Then** the search uses the correct provider and result shape for that category.

**Given** I select a media result  
**When** autofill is applied  
**Then** title, creator, year, image, and rating fields populate only where appropriate  
**And** the dropdown closes cleanly without reopening unexpectedly.

**Given** I use the travel flow  
**When** I pick a place  
**Then** the note stores visible place context and coordinates  
**And** the form makes the map-related behavior understandable.

### Story 1.4: Search and filter foundations for personal notes

As a user with a growing archive,  
I want note search, category filtering, and tag narrowing to work together predictably,  
So that I can quickly find what I already captured.

**Acceptance Criteria:**

**Given** I search or filter my notes  
**When** I combine query, category, and tag criteria  
**Then** the results reflect those criteria without conflicting states.

**Given** I paginate or scroll through results  
**When** more items load  
**Then** ordering remains stable and no duplicates appear.

**Given** I return to the notes screen later  
**When** I repeat the same query path  
**Then** the interaction pattern and labels remain consistent across notes-related surfaces.

## Epic 2: Stronger Personal Library and Recall

Help users organize saved content, revisit it later, and understand their own media history through clearer library, collection, and insight experiences.

### Story 2.1: Unified organization layer across bookmarks, collections, and watchlist

As a power user,  
I want bookmarks, collections, and watchlist/wishlist behaviors to feel complementary instead of fragmented,  
So that I can organize content confidently.

**Acceptance Criteria:**

**Given** I save content through bookmark, collection, or watchlist actions  
**When** I revisit related screens  
**Then** the terminology and interaction states are consistent.

**Given** I open a collection or watchlist item  
**When** I scan the page  
**Then** I can easily tell what action is available next  
**And** the screen reinforces the difference between temporary saving and long-term grouping.

**Given** I add or remove an item from one organization surface  
**When** I navigate to a related surface  
**Then** the state remains synchronized.

### Story 2.2: More useful stats and year-in-review experience

As a user who revisits past activity,  
I want stats and yearly summaries to surface meaningful patterns,  
So that my archive feels alive instead of static.

**Acceptance Criteria:**

**Given** I open stats or year-in-review  
**When** data is available  
**Then** charts and summaries highlight understandable personal trends, not just raw numbers.

**Given** I interact with visual summaries  
**When** I move between sections  
**Then** the design remains readable on both mobile and desktop  
**And** data density stays manageable.

**Given** there is little or no historical data  
**When** the screen renders  
**Then** the empty state explains what is missing and how to generate useful history.

### Story 2.3: Better revisitability through note detail, tags, and public surfaces

As a user returning to old notes,  
I want note detail and public surfaces to connect clearly back to my archive context,  
So that I can navigate memory paths instead of isolated pages.

**Acceptance Criteria:**

**Given** I open a note detail page  
**When** I read it  
**Then** the page presents image, metadata, tags, community signals, and content in a clear reading order.

**Given** I click a tag or related surface  
**When** navigation occurs  
**Then** the destination page feels like part of the same product grammar, not a disconnected route.

**Given** a note contains spoiler-sensitive content  
**When** spoiler behavior is relevant  
**Then** the page protects the content without making the screen cumbersome to use.

## Epic 3: Clearer Discovery and Social Confidence

Make profiles, feeds, recommendations, discovery, comments, likes, and notifications easier to understand so users trust the social side of the product without losing control.

### Story 3.1: Profile and follow clarity

As a user exploring other people’s archives,  
I want profiles and follow states to be immediately understandable,  
So that I can decide who to follow and why.

**Acceptance Criteria:**

**Given** I open a public profile  
**When** the page loads  
**Then** I can quickly understand who the user is, what they share, and how active they are.

**Given** I follow or unfollow someone  
**When** the action completes  
**Then** profile and follow list states update predictably  
**And** feedback makes the result obvious.

**Given** a profile has collections or recent posts  
**When** I browse the page  
**Then** those sections reinforce discovery rather than competing for attention.

### Story 3.2: Distinct feed, recommended, and discover behaviors

As a user seeking new content,  
I want feed, recommended, and discover screens to serve different purposes clearly,  
So that each one feels useful instead of redundant.

**Acceptance Criteria:**

**Given** I move between feed, recommended, and discover  
**When** I compare them  
**Then** each screen has its own explanatory framing and card emphasis.

**Given** I inspect a recommendation or discovered post  
**When** I act on it  
**Then** the route to saving, opening, or following stays obvious.

**Given** result lists are empty or loading  
**When** the screen state appears  
**Then** the copy explains why and what to do next.

### Story 3.3: Consistent comments, likes, and notifications loop

As a socially active user,  
I want interaction feedback loops to feel connected,  
So that comments, likes, and notifications reinforce each other instead of feeling separate.

**Acceptance Criteria:**

**Given** I like or comment on a post  
**When** the action succeeds  
**Then** the UI updates quickly and visibly on the current page.

**Given** another user interacts with my content  
**When** I open notifications  
**Then** unread counts and read states are accurate  
**And** the notification helps me navigate back to the relevant context.

**Given** comments have replies  
**When** I read the thread  
**Then** reply depth and ownership remain understandable without visual clutter.

## Epic 4: Safer Operations and Product Trust

Improve operational confidence for both end users and admins through clearer recovery, moderation, export, maintenance, and reliability behavior.

### Story 4.1: Admin moderation and visibility workspace

As an admin,  
I want user, content, activity, and settings views to provide actionable visibility,  
So that I can manage the platform responsibly.

**Acceptance Criteria:**

**Given** I open admin screens  
**When** I review users, posts, activity, or settings  
**Then** each screen clearly communicates what can be acted on and what is informational.

**Given** I perform an admin action  
**When** the request completes  
**Then** success or failure is explicit  
**And** I can tell whether follow-up action is needed.

**Given** moderation-sensitive data is shown  
**When** I inspect it  
**Then** the UI avoids ambiguous labels and exposes enough context for safe decisions.

### Story 4.2: Export, maintenance, and recovery confidence

As a user or operator,  
I want data export and maintenance states to be understandable and trustworthy,  
So that I know my archive and the system are recoverable.

**Acceptance Criteria:**

**Given** I request an export  
**When** the response arrives  
**Then** the file contains clean, readable data representations  
**And** long-form content is safe to consume outside the app.

**Given** the system enters maintenance or degraded conditions  
**When** I visit the product  
**Then** the messaging explains what is happening and what I can still do.

**Given** an operation fails unexpectedly  
**When** I retry or navigate away  
**Then** the product gives me a clear recovery path.

### Story 4.3: Safer session, media, and fallback handling

As an everyday user,  
I want session expiry, remote media failures, and request errors to degrade gracefully,  
So that the product feels reliable even when dependencies fail.

**Acceptance Criteria:**

**Given** my session expires  
**When** I attempt a protected action  
**Then** I receive a human-readable recovery message and a clear route back to login.

**Given** a remote image or media source fails  
**When** the UI renders  
**Then** the screen falls back gracefully without breaking layout or meaning.

**Given** a protected API route fails because of auth or server conditions  
**When** the client consumes the error  
**Then** it produces a consistent Turkish error experience rather than raw technical output.
