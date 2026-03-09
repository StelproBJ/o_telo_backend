-- Migration: Ajouter minPrice et address aux hôtels
-- Date: 2026-02-25

-- Ajouter la colonne address
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS address TEXT;

-- Ajouter la colonne min_price (prix en FCFA)
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS min_price INTEGER;

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN hotels.address IS 'Adresse complète de l''hôtel';
COMMENT ON COLUMN hotels.min_price IS 'Prix minimum d''une chambre en FCFA';