-- Порядок тарифов на сайте: 12 мес. (максимальная выгода) → 6 → 3 → 1
UPDATE pricing_plan_terms SET sort_order = 10 WHERE months = 12;
UPDATE pricing_plan_terms SET sort_order = 20 WHERE months = 6;
UPDATE pricing_plan_terms SET sort_order = 30 WHERE months = 3;
UPDATE pricing_plan_terms SET sort_order = 40 WHERE months = 1;
