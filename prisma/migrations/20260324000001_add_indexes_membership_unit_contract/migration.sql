-- AddIndex: Membership(userId) — speeds up finding all condos for a user (every page load)
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- AddIndex: Unit(ownerId) — speeds up owner portal dashboard queries
CREATE INDEX "Unit_ownerId_idx" ON "Unit"("ownerId");

-- AddIndex: Unit(tenantId) — speeds up tenant portal dashboard queries
CREATE INDEX "Unit_tenantId_idx" ON "Unit"("tenantId");

-- AddIndex: Contract(condominiumId) — speeds up contracts page listing
CREATE INDEX "Contract_condominiumId_idx" ON "Contract"("condominiumId");
