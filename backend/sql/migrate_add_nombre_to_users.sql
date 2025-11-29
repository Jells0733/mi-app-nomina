-- Migración: Agregar campo 'nombre' a la tabla users
-- Ejecutar este script si la base de datos ya existe y necesita actualizarse

-- Agregar columna 'nombre' a la tabla users si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'nombre'
    ) THEN
        ALTER TABLE users ADD COLUMN nombre VARCHAR(100);
        RAISE NOTICE 'Columna nombre agregada exitosamente a la tabla users';
    ELSE
        RAISE NOTICE 'La columna nombre ya existe en la tabla users';
    END IF;
END $$;

