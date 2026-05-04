-- profiles
CREATE TABLE profiles (
  id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name  TEXT NOT NULL,
  role  TEXT NOT NULL DEFAULT 'worker'
        CHECK (role IN ('admin', 'worker')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- fields（田んぼ）
CREATE TABLE fields (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner      TEXT,
  area_ha    NUMERIC(6,4),
  geometry   JSONB NOT NULL,
  fude_id    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- work_types（作業種別）
CREATE TABLE work_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT '#6b7280',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- work_records（作業記録）
CREATE TABLE work_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id     UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  work_type_id UUID NOT NULL REFERENCES work_types(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'in_progress', 'done')),
  assigned_to  UUID REFERENCES auth.users(id),
  scheduled_at DATE,
  completed_at DATE,
  memo         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_id, work_type_id)
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fields_updated_at
  BEFORE UPDATE ON fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER work_records_updated_at
  BEFORE UPDATE ON work_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
