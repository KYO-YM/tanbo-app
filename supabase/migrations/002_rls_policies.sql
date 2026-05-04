-- RLS 有効化
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields       ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_types   ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;

-- profiles: 全員が読める。自分のみ更新可
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- fields: ログイン済みは全て読める。adminのみ作成・更新・削除
CREATE POLICY "fields_select" ON fields FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "fields_insert" ON fields FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "fields_update" ON fields FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "fields_delete" ON fields FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- work_types: 全員が読める。adminのみ変更
CREATE POLICY "work_types_select" ON work_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "work_types_insert" ON work_types FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "work_types_update" ON work_types FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "work_types_delete" ON work_types FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- work_records: 全員が読める・更新可。削除はadminのみ
CREATE POLICY "work_records_select" ON work_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "work_records_insert" ON work_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "work_records_update" ON work_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "work_records_delete" ON work_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
