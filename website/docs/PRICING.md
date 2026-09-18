# Proposed membership economics

September 18, 2026. These are launch hypotheses, not validated optimal prices or live offers. No payments are implemented.

## Primary metric: manuscript words processed per month

Words are a better first pricing unit than pages (formatting changes them), finished audio hours (depends on narration pace), or books (length varies greatly). Show examples using an explicitly stated 80,000-word book. Count a manuscript's words before processing and show the charge to the allowance. Define reprocessing and revision rules before release.

| Proposed plan | Monthly | Yearly total | Effective monthly, yearly billing | Words/month | Seats | Monthly price per fully used 80k words |
| ------------- | ------: | -----------: | --------------------------------: | ----------: | ----: | -------------------------------------: |
| Essential     |     $19 |         $180 |                               $15 |     150,000 |     1 |                                 $10.13 |
| Narrator      |     $39 |         $372 |                               $31 |     400,000 |     1 |                                  $7.80 |
| Studio        |     $99 |         $948 |                               $79 |   1,200,000 |     3 |                                  $6.60 |

The last column is normalized unit pricing at full utilization, not a promise that fractional book capacity lets every customer complete that number of projects. At 80,000 words per whole book, the allowances fit 1, 5 and 15 complete books respectively. Shorter projects can use the remaining allowance. Annual discounts are 21.1%, 20.5% and 20.2%, so the website says “about 20%.” Annual plans still reset usage each month.

## Market context

[PreRead](https://prereadnow.com/) publicly advertises on-demand preparation from $15 per standard audiobook and subscriptions as low as $7 per audiobook. Its detailed tier definitions are not public on that page, so this is directional, not an apples-to-apples comparison. [Story Mimic](https://www.storymimic.com/pricing) lists a $9.99/month narrator workspace with a different feature and usage model. Both pages were checked on September 18, 2026.

The proposal puts the regular-use Narrator plan near the publicly advertised prep subscription range while retaining an accessible entry plan. It does not claim to be the cheapest, fastest or most accurate product. Differentiate through verifiable manuscript references, editable prep notes and a narrator-specific experience once those exist.

## Cost gates before selling these plans

Targeting 75% gross margin leaves at most 25% of revenue for direct costs. At fully used annual-plan allowances, the direct cost ceiling per 1,000 manuscript words is:

| Plan      | Monthly equivalent revenue | 25% direct-cost budget | Budget per 1k words |
| --------- | -------------------------: | ---------------------: | ------------------: |
| Essential |                        $15 |                  $3.75 |             $0.0250 |
| Narrator  |                        $31 |                  $7.75 |             $0.0194 |
| Studio    |                        $79 |                 $19.75 |             $0.0165 |

These ceilings must cover model calls, retries, parsing, pronunciation services, storage, payment fees and direct support. Actual model costs are unknown: no provider or production workload has been selected. Multiple passes over a manuscript can multiply cost. Do not sell annual commitments until full-utilization economics have been measured.

Measure real processing cost per 1,000 words across fiction/nonfiction, short/long works, unusual names and failed or retried runs. Track quality, time to ready, user correction rate, allowance utilization and repeat usage. If the cost gate fails, raise the price, reduce the allowance or improve the pipeline before launch. Do not rely on unused allowances to hide unprofitable heavy users.

## Decisions still needed

- Define what consumes words: initial prep, whole-book reruns and changed chapters.
- Publish handling of failed jobs and duplicate submissions; failed jobs should not silently consume capacity.
- Validate optional prepaid top-ups for narrators with irregular schedules.
- Confirm rollover policy and storage limits; no rollover promise is made yet.
- Confirm team sharing, cancellation, renewal, taxes and refunds before checkout exists.
- Validate willingness to pay with narrators and producers rather than treating competitor prices as demand proof.

Plan data lives in `assets/pricing.js`; initial HTML must also be kept in sync for no-JavaScript visitors.
