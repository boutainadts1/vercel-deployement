import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Initialize database schema and insert users
export const initializeDatabase = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();

    // === Create tables if not exist ===
    await connection.query(`
      CREATE TABLE IF NOT EXISTS UTILISATEUR (
        id_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'CHEF') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_active (is_active)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS VEHICULE (
        id_vehicule INT PRIMARY KEY AUTO_INCREMENT,
        marque VARCHAR(100) NOT NULL,
        modele VARCHAR(100) NOT NULL,
        annee YEAR,
        vin VARCHAR(17) UNIQUE,
        numero_plaque VARCHAR(20),
        responsable_id INT NOT NULL,
        statut ENUM('ACTIVE', 'MAINTENANCE', 'RETIRED') DEFAULT 'ACTIVE',
        index_debut_mois INT DEFAULT 0,
        index_fin_mois INT DEFAULT 0,
        total_carburant_prix DECIMAL(10,2) DEFAULT 0.00,
        total_maintenance_prix DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (responsable_id) REFERENCES UTILISATEUR(id_utilisateur),
        INDEX idx_responsable (responsable_id),
        INDEX idx_statut (statut),
        INDEX idx_marque_modele (marque, modele)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS REPARATION (
        id_reparation INT PRIMARY KEY AUTO_INCREMENT,
        date_reparation DATE NOT NULL,
        description TEXT,
        cout_total DECIMAL(10,2) DEFAULT 0.00,
        statut ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PLANNED',
        vehicule_id INT NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (vehicule_id) REFERENCES VEHICULE(id_vehicule),
        FOREIGN KEY (created_by) REFERENCES UTILISATEUR(id_utilisateur),
        INDEX idx_vehicule (vehicule_id),
        INDEX idx_created_by (created_by),
        INDEX idx_statut (statut),
        INDEX idx_date (date_reparation)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS PIECE (
        id_piece INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(100) NOT NULL,
        reference VARCHAR(100) NOT NULL,
        prix_unitaire DECIMAL(10,2) DEFAULT 0.00,
        stock_actuel INT DEFAULT 0,
        stock_minimum INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reference (reference),
        INDEX idx_stock (stock_actuel),
        INDEX idx_low_stock (stock_actuel, stock_minimum),
        UNIQUE KEY unique_nom_ref (nom, reference)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS REPARATION_PIECE (
        reparation_id INT,
        piece_id INT,
        quantite INT NOT NULL DEFAULT 1,
        prix_unitaire_utilise DECIMAL(10,2) DEFAULT 0.00,
        PRIMARY KEY (reparation_id, piece_id),
        FOREIGN KEY (reparation_id) REFERENCES REPARATION(id_reparation) ON DELETE CASCADE,
        FOREIGN KEY (piece_id) REFERENCES PIECE(id_piece),
        INDEX idx_reparation (reparation_id),
        INDEX idx_piece (piece_id)
      )
    `);

    // === Insert predefined users (only if not exist) ===
    await connection.query(`
      INSERT IGNORE INTO UTILISATEUR 
      (nom, email, mot_de_passe, role, created_at, updated_at, is_active, last_login)
      VALUES
      ('HACHEMI BETTAHAR', 'HACHEMI.BETTAHAR@algerietelecom.dz', SHA2(CONCAT('HACHEMI BETTAHAR','123!'), 256), 'ADMIN', NOW(), NOW(), 1, NULL),
      ('MHAMED BRAIK', 'MHAMED.BRAIK@algerietelecom.dz', SHA2(CONCAT('MHAMED BRAIK','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL),
      ('BELMEHEL LARBI DAOUADJI', 'BELMEHEL.LARBIDAOUADJI@algerietelecom.dz', SHA2(CONCAT('BELMEHEL LARBI DAOUADJI','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL),
      ('AHMED RABAH', 'AHMED.RABAH@algerietelecom.dz', SHA2(CONCAT('AHMED RABAH','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL),
      ('AHMED BOUTERBIAT', 'AHMED.BOUTERBIAT@algerietelecom.dz', SHA2(CONCAT('AHMED BOUTERBIAT','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL),
      ('AHMED GHENISSA', 'AHMED.GHENISSA@algerietelecom.dz', SHA2(CONCAT('AHMED GHENISSA','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL),
      ('KARIM BESSEDIK', 'KARIM.BESSEDIK@algerietelecom.dz', SHA2(CONCAT('KARIM BESSEDIK','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL),
      ('RADOUANE GHOUL', 'RADOUANE.GHOUL@algerietelecom.dz', SHA2(CONCAT('RADOUANE GHOUL','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL),
      ('cel relizane', 'cel-relizane@algerietelecom.dz', SHA2(CONCAT('cel relizane','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL),
      ('BOUABDELLAH BENREKHREKH', 'BOUABDELLAH.BENREKHREKH@algerietelecom.dz', SHA2(CONCAT('BOUABDELLAH BENREKHREKH','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL),
      ('FATIMA BENAISSA', 'FATIMA.BENAISSA@algerietelecom.dz', SHA2(CONCAT('FATIMA BENAISSA','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL),
      ('khadidja ouandelous', 'khadidja.ouandelous@algerietelecom.dz', SHA2(CONCAT('khadidja ouandelous','123!'), 256), 'ADMIN', NOW(), NOW(), 1, NULL),
      ('MESSAOUD BENKELTOUM', 'MESSAOUD.BENKELTOUM@algerietelecom.dz', SHA2(CONCAT('MESSAOUD BENKELTOUM','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL),
      ('MADIHA BENOUARET', 'MADIHA.BENOUARET@algerietelecom.dz', SHA2(CONCAT('MADIHA BENOUARET','123!'), 256), 'CHEF', NOW(), NOW(), 1, NULL)
    `);
    // === Insert vehicles without duplicates ===
    await connection.query(`
      INSERT IGNORE INTO VEHICULE (marque, modele, annee, vin, numero_plaque, responsable_id, statut)
      VALUES 
       ('Chevrolet', '06049-112-48 Spark Luxe', 2012, '676304', '06049-112-48', 1, 'ACTIVE'),
  ('Chevrolet', '06050-112-48 Spark Luxe', 2012, '686356', '06050-112-48', 1, 'ACTIVE'),
  ('GERMAN', '106331-00-25 CE 130 D', 2019, 'G19011804', '106331-00-25', 1, 'ACTIVE'),
  ('HONOR', 'LFFWJT658D10000-67- SCOOTER EXPRESS', 2013, 'LFFWJT658D1000067', 'LFFWJT658D10000-67-', 1, 'ACTIVE'),
  ('HONOR', 'LFFWJT65XD10000-68- SCOOTER EXPRESS', 2013, 'LFFWJT65XD1000068', 'LFFWJT65XD10000-68-', 1, 'ACTIVE'),
  ('Hyundai', '00640-206-48 HD72', 2006, '33146', '00640-206-48', 1, 'ACTIVE'),
  ('Peugeot', '00290-114-48 Partner', 2014, '510461', '00290-114-48', 1, 'ACTIVE'),
  ('Renault', '02959-114-48 Fluence', 2014, '51106815', '02959-114-48', 1, 'ACTIVE'),
  ('Renault', '00880-315-48 Kangoo', 2015, '51862168', '00880-315-48', 1, 'ACTIVE'),
  ('Renault', '00881-115-48 Kangoo', 2015, '51886749', '00881-115-48', 1, 'ACTIVE'),
  ('Renault', '00882-115-48 Kangoo', 2015, '51886709', '00882-115-48', 1, 'ACTIVE'),
  ('Renault', '00879-315-48 Kangoo', 2015, '51862578', '00879-315-48', 1, 'ACTIVE'),
  ('Renault', '00883-315-48 Kangoo', 2015, '51862308', '00883-315-48', 1, 'ACTIVE'),
  ('Renault', '00884-115-48 Kangoo', 2015, '51886780', '00884-115-48', 1, 'ACTIVE'),
  ('Renault', '00885-315-48 Kangoo', 2015, '51862633', '00885-315-48', 1, 'ACTIVE'),
  ('Renault', '01516-315-48 Kangoo', 2015, '51862265', '01516-315-48', 1, 'ACTIVE'),
  ('Renault', '04686-314-48 Kangoo', 2014, '51862419', '04686-314-48', 1, 'ACTIVE'),
  ('Renault', '04687-314-48 Kangoo', 2014, '51862465', '04687-314-48', 1, 'ACTIVE'),
  ('Renault', '04690-114-48 Kangoo', 2014, '51886505', '04690-114-48', 1, 'ACTIVE'),
  ('Renault', '04692-114-48 Kangoo', 2014, '51886696', '04692-114-48', 1, 'ACTIVE'),
  ('Renault', '04693-114-48 Kangoo', 2014, '51899066', '04693-114-48', 1, 'ACTIVE'),
  ('Renault', '04694-314-48 Kangoo', 2014, '51862191', '04694-314-48', 1, 'ACTIVE'),
  ('Renault', '05052-314-48 Kangoo', 2014, '51862479', '05052-314-48', 1, 'ACTIVE'),
  ('Renault', '05182-313-48 Kangoo', 2013, '49339015', '05182-313-48', 1, 'ACTIVE'),
  ('Renault', '05183-313-48 Kangoo', 2013, '49338480', '05183-313-48', 1, 'ACTIVE'),
  ('Renault', '05184-313-48 Kangoo', 2013, '49339367', '05184-313-48', 1, 'ACTIVE'),
  ('Renault', '05185-313-48 Kangoo', 2013, '49338814', '05185-313-48', 1, 'ACTIVE'),
  ('Renault', '05186-313-48 Kangoo', 2013, '49338997', '05186-313-48', 1, 'ACTIVE'),
  ('Renault', '05187-313-48 Kangoo', 2013, '49338976', '05187-313-48', 1, 'ACTIVE'),
  ('Renault', '05188-313-48 Kangoo', 2013, '49339407', '05188-313-48', 1, 'ACTIVE'),
  ('Renault', '05246-313-48 Kangoo', 2013, '49338764', '05246-313-48', 1, 'ACTIVE'),
  ('Renault', '05837-313-48 Kangoo', 2013, '49338373', '05837-313-48', 1, 'ACTIVE'),
  ('SEAT', '03879-118-48 IBIZA', 2018, 'VSSZZZKJZJ5015095', '03879-118-48', 1, 'ACTIVE'),
  ('SEAT', '03880-118-48 IBIZA', 2018, 'VSSZZZKJZJ5015118', '03880-118-48', 1, 'ACTIVE'),
  ('SEAT', '03881-118-48 IBIZA', 2018, 'VSSZZZKJZJ5014823', '03881-118-48', 1, 'ACTIVE'),
  ('VW', '008720-319-16 CADDY', 2019, 'WV1ZZZ2KZKR006706', '008720-319-16', 1, 'ACTIVE'),
  ('VW', '03724-118-48 CADDY', 2018, 'WV2ZZZ2KZJR007856', '03724-118-48', 1, 'ACTIVE'),
  ('VW', '03882-318-48 CADDY', 2018, 'WV1ZZZ2KZKR002780', '03882-318-48', 1, 'ACTIVE'),
  ('VW', '03925-318-48 CADDY', 2018, 'WV1ZZZ2KZKR002568', '03925-318-48', 1, 'ACTIVE'),
  ('VW', '03926-318-48 CADDY', 2018, 'WV1ZZZ2KZKR002685', '03926-318-48', 1, 'ACTIVE'),
  ('VW', '045326-119-16 CADDY', 2019, 'WV2ZZZ2KZKR005834', '045326-119-16', 1, 'ACTIVE'),
  ('VW', '071931-119-16 CADDY', 2019, 'WV2ZZZ2KZKR005617', '071931-119-16', 1, 'ACTIVE'),
  ('VW', '008724-319-16 CADDY 2K', 2019, 'WV1ZZZ2KZKR007242', '008724-319-16', 1, 'ACTIVE')
`);
 // === Insert pieces without duplicates ===
    await connection.query(`
      INSERT IGNORE INTO PIECE (nom, reference, prix_unitaire, stock_actuel, stock_minimum)
      VALUES
      ('F/P Alternateur', 'Kangoo', 52000.00, 0, 5),
  ('F/P Appareil Clignotant', 'Kangoo', 20000.00, 0, 5),
  ('F/P Bague démarreur', 'Kangoo', 2000.00, 0, 5),
  ('F/P Balai d''essuie glace', 'Kangoo', 3000.00, 0, 5),
  ('F/P Bouchon de vase d''expansion', 'Kangoo', 3200.00, 0, 5),
  ('F/P Câble de frein a main', 'Kangoo', 4000.00, 0, 5),
  ('F/P Câble d''embrayage', 'Kangoo', 2500.00, 0, 5),
  ('F/P Capteur de pression', 'Kangoo', 11000.00, 0, 5),
  ('F/P capteur de température', 'Kangoo', 5000.00, 0, 5),
  ('F/P Capteur d''huile', 'Kangoo', 5000.00, 0, 5),
  ('F/P Capteur tachymetre', 'Kangoo', 3000.00, 0, 5),
  ('F/P Cardon droit', 'Kangoo', 28000.00, 0, 5),
  ('F/P Cardon gauche', 'Kangoo', 26000.00, 0, 5),
  ('F/P Carter', 'Kangoo', 20000.00, 0, 5),
  ('F/P Charbon démarreur', 'Kangoo', 2800.00, 0, 5),
  ('F/P Contacteur', 'Kangoo', 7000.00, 0, 5),
  ('F/P Courroie d''alternateur', 'Kangoo', 4800.00, 0, 5),
  ('F/P Crémaillère', 'Kangoo', 50000.00, 0, 5),
  ('F/P Démarreur', 'Kangoo', 25000.00, 0, 5),
  ('Démontage et montage d''un pneu y compris l''équilibrage', 'Kangoo', 1000.00, 0, 5),
  ('F/P Disque de frein arrière', 'Kangoo', 30000.00, 0, 5),
  ('F/P Disque de frein avant', 'Kangoo', 24000.00, 0, 5),
  ('F/P Durite d''eau', 'Kangoo', 5000.00, 0, 5),
  ('Débouchage Radiateur', 'Kangoo', 3000.00, 0, 5),
  ('F/P Embout de crémaillère', 'Kangoo', 8500.00, 0, 5),
  ('F/P Filtre à air', 'Kangoo', 1600.00, 0, 5),
  ('F/P Filtre à gasoil', 'Kangoo', 5000.00, 0, 5),
  ('F/P Filtre à l''huile', 'Kangoo', 1000.00, 0, 5),
  ('F/P Filtre climatiseur', 'Kangoo', 2800.00, 0, 5),
  ('F/P Flexible de frein', 'Kangoo', 10000.00, 0, 5),
  ('F/P Fourchette d''embrayage', 'Kangoo', 8000.00, 0, 5),
  ('F/P Gaz de Climatiseur', 'Kangoo', 5000.00, 0, 5),
  ('F/P Guide butée', 'Kangoo', 18000.00, 0, 5),
  ('F/P Huile d''assisté ATF (01 Litre)', 'Kangoo', 1000.00, 0, 5),
  ('F/P huile de boite a vitesse (01 litres)', 'Kangoo', 3200.00, 0, 5),
  ('F/P Huile DOT 4', 'Kangoo', 1200.00, 0, 5),
  ('F/P Injecteur', 'Kangoo', 37000.00, 0, 5),
  ('F/P Jeu d''amortisseur arrière', 'Kangoo', 23000.00, 0, 5),
  ('F/P Jeu d''amortisseur avant', 'Kangoo', 33000.00, 0, 5),
  ('F/P Jeu de bougie de préchauffage', 'Kangoo', 2000.00, 0, 5),
  ('F/P Jeu de silent bloc arrière', 'Kangoo', 23000.00, 0, 5),
  ('F/P Jeu de silent bloc barre stabilisation', 'Kangoo', 9500.00, 0, 5),
  ('F/P Joint de cache culbuteur', 'Kangoo', 3000.00, 0, 5),
  ('F/P Joint de culasse', 'Kangoo', 5000.00, 0, 5),
  ('F/P Joint de spi arbre a came', 'Kangoo', 15000.00, 0, 5),
  ('F/P Kit chaine de distribution Y Compris les courroies', 'Kangoo', 23000.00, 0, 5),
  ('F/P Kit d''embrayage (plateau+ disque+butée)', 'Kangoo', 40000.00, 0, 5),
  ('F/P lampe 01 plot', 'Kangoo', 200.00, 0, 5),
  ('F/P lampe 02 plot', 'Kangoo', 200.00, 0, 5),
  ('F/P lampe de 12 volte', 'Kangoo', 250.00, 0, 5),
  ('F/P Lampe de Code et Phare', 'Kangoo', 250.00, 0, 5),
  ('F/P Lanceur démarreur (bain disque)', 'Kangoo', 2500.00, 0, 5),
  ('Liquide de refroidissement GLACEOL (5Litre) G12 OU G13', 'Kangoo', 3000.00, 0, 5),
  ('F/P Maitre cylindre de frein', 'Kangoo', 15000.00, 0, 5),
  ('F/P Manchon de cardon', 'Kangoo', 7800.00, 0, 5),
  ('F/P Moteur de monte de glace', 'Kangoo', 45000.00, 0, 5),
  ('F/P Moteur lave glace', 'Kangoo', 50000.00, 0, 5),
  ('F/P Moyeu arrière', 'Kangoo', 30000.00, 0, 5),
  ('F/P Moyeu avant', 'Kangoo', 15000.00, 0, 5),
  ('F/P Nécessaire maître cylindre de frein', 'Kangoo', 5000.00, 0, 5),
  ('F/P Nécessaire pompe de frein', 'Kangoo', 5000.00, 0, 5),
  ('Nettoyage Vanne EGR', 'Kangoo', 2000.00, 0, 5),
  ('Parallélisme', 'Kangoo', 1000.00, 0, 5),
  ('F/P Pipe d''eau', 'Kangoo', 9500.00, 0, 5),
  ('F/P Piston de frein arrière', 'Kangoo', 15000.00, 0, 5),
  ('F/P Plaquette de frein arrière', 'Kangoo', 9000.00, 0, 5),
  ('F/P Plaquette de frein avant', 'Kangoo', 8000.00, 0, 5),
  ('F/P Poignet extérieur de porte', 'Kangoo', 6000.00, 0, 5),
  ('F/P Poignet intérieur de porte', 'Kangoo', 5000.00, 0, 5),
  ('F/P Pompe à eau', 'Kangoo', 13000.00, 0, 5),
  ('F/P Pompe de frein', 'Kangoo', 16000.00, 0, 5),
  ('F/P Pompe HP', 'Kangoo', 97000.00, 0, 5),
  ('F/P Porte charbon démarreur', 'Kangoo', 5000.00, 0, 5),
  ('Rabotage Bloc y compris réparation mécanique', 'Kangoo', 8000.00, 0, 5),
  ('Rabotage culasse y compris réparation mécanique', 'Kangoo', 5000.00, 0, 5),
  ('F/P Refroidisseur d''huile', 'Kangoo', 13000.00, 0, 5),
  ('F/P Régulateur alternateur', 'Kangoo', 9800.00, 0, 5),
  ('Réparation boite à vitesse', 'Kangoo', 25000.00, 0, 5),
  ('F/P Rétroviseur', 'Kangoo', 10000.00, 0, 5),
  ('F/P Rotule de direction', 'Kangoo', 10000.00, 0, 5),
  ('F/P Rotule de fusée', 'Kangoo', 10000.00, 0, 5),
  ('F/P Roulement alternateur', 'Kangoo', 7000.00, 0, 5),
  ('F/P Roulement de roue', 'Kangoo', 14000.00, 0, 5),
  ('F/P Roulement de tasseau', 'Kangoo', 11000.00, 0, 5),
  ('F/P Serrure porte', 'Kangoo', 24000.00, 0, 5),
  ('F/P Soufflet de cardon cote boite', 'Kangoo', 9500.00, 0, 5),
  ('F/P Soufflet de cardon cote roue', 'Kangoo', 8500.00, 0, 5),
  ('F/P Support boite a vitesse', 'Kangoo', 10000.00, 0, 5),
  ('F/P Support moteur', 'Kangoo', 9000.00, 0, 5),
  ('F/P Tasseau', 'Kangoo', 8500.00, 0, 5),
  ('F/P Thermostat', 'Kangoo', 8000.00, 0, 5),
  ('F/P Tirant de suspension', 'Kangoo', 6800.00, 0, 5),
  ('F/P Triangle de suspension', 'Kangoo', 18000.00, 0, 5),
  ('F/P Turbo compresseur', 'Kangoo', 80000.00, 0, 5),
  ('F/P Vanne EGR', 'Kangoo', 28000.00, 0, 5),
  ('F/P Vase d''eau', 'Kangoo', 12000.00, 0, 5),
  ('F/P Ventilateur', 'Kangoo', 26000.00, 0, 5),
  ('F/P Radiateur de climatiseur', 'Kangoo', 31000.00, 0, 5),
  ('F/P Feux AR Gauche', 'Kangoo', 11000.00, 0, 5),
  ('F/P Feux AR Droite', 'Kangoo', 11000.00, 0, 5),
  ('F/P Intérrupteur Doublé', 'Kangoo', 7000.00, 0, 5),
  ('F/P Vitre parprise', 'Kangoo', 25500.00, 0, 5),
  ('Main d''œuvre tolier', 'Kangoo', 2000.00, 0, 5),
  ('Main d''œuvre électricité', 'Kangoo', 1800.00, 0, 5),
  ('F/P vitre porte AV', 'Kangoo', 14000.00, 0, 5),
  ('F/P vitre porte AR', 'Kangoo', 8000.00, 0, 5),
  ('F/P vitre porte AR coffre Tolier', 'Kangoo', 17000.00, 0, 5),
  ('F/P Echangeur', 'Kangoo', 14000.00, 0, 5),
  ('Vidange Huile moteur (5L Huile CASTROL + Rondelle d''étanchéité + main d''œuvre)', 'Kangoo', 7000.00, 0, 5),
 ('F/P Alternateur', 'Fluence', 48000.00, 0, 5),
  ('F/P Appareil Clignotant', 'Fluence', 21000.00, 0, 5),
  ('F/P Bague démarreur', 'Fluence', 2000.00, 0, 5),
  ('F/P Balai d''essuie glace', 'Fluence', 2800.00, 0, 5),
  ('F/P Bobine d''allumage', 'Fluence', 16000.00, 0, 5),
  ('F/P Câble de frein a main', 'Fluence', 4000.00, 0, 5),
  ('F/P Câble d''embrayage', 'Fluence', 2500.00, 0, 5),
  ('F/P Capteur de pression', 'Fluence', 11000.00, 0, 5),
  ('F/P capteur de température', 'Fluence', 5000.00, 0, 5),
  ('F/P Capteur d''huile', 'Fluence', 5000.00, 0, 5),
  ('F/P Capteur tachymetre', 'Fluence', 3000.00, 0, 5),
  ('F/P Cardon droit', 'Fluence', 28000.00, 0, 5),
  ('F/P Cardon gauche', 'Fluence', 26000.00, 0, 5),
  ('F/P Carter', 'Fluence', 20000.00, 0, 5),
  ('F/P Catalyseur', 'Fluence', 99000.00, 0, 5),
  ('F/P Charbon démarreur', 'Fluence', 2800.00, 0, 5),
  ('F/P Contacteur', 'Fluence', 7000.00, 0, 5),
  ('F/P Courroie d''alternateur', 'Fluence', 3840.00, 0, 5),
  ('F/P Crémaillère', 'Fluence', 56000.00, 0, 5),
  ('F/P Démarreur', 'Fluence', 26250.00, 0, 5),
  ('Démontage et montage d''un pneu y compris l''équilibrage', 'Fluence', 1000.00, 0, 5),
  ('F/P Disque de frein arrière', 'Fluence', 28000.00, 0, 5),
  ('F/P Disque de frein avant', 'Fluence', 23000.00, 0, 5),
  ('F/P Durite d''eau', 'Fluence', 5000.00, 0, 5),
  ('F/P Embout de crémaillère', 'Fluence', 16000.00, 0, 5),
  ('F/P Faisceau de bougie', 'Fluence', 7000.00, 0, 5),
  ('F/P Filtre à air', 'Fluence', 1600.00, 0, 5),
  ('F/P Filtre à essence', 'Fluence', 4000.00, 0, 5),
  ('F/P Filtre à l''huile', 'Fluence', 1000.00, 0, 5),
  ('F/P Filtre climatiseur', 'Fluence', 2800.00, 0, 5),
  ('F/P Flexible de frein', 'Fluence', 10000.00, 0, 5),
  ('F/P Fourchette d''embrayage', 'Fluence', 8000.00, 0, 5),
  ('F/P Gaz de Climatiseur', 'Fluence', 5000.00, 0, 5),
  ('F/P Guide butée', 'Fluence', 18000.00, 0, 5),
  ('F/P Huile d''assisté ATF (01 Litre)', 'Fluence', 1000.00, 0, 5),
  ('F/P huile de boite a vitesse (01 litres)', 'Fluence', 3200.00, 0, 5),
  ('F/P Huile DOT 4', 'Fluence', 1200.00, 0, 5),
  ('F/P Injecteur', 'Fluence', 7000.00, 0, 5),
  ('F/P Jeu d''amortisseur arrière', 'Fluence', 21000.00, 0, 5),
  ('F/P Jeu d''amortisseur avant', 'Fluence', 31000.00, 0, 5),
  ('F/P Jeu de bougie', 'Fluence', 3000.00, 0, 5),
  ('F/P Jeu de silent bloc arrière', 'Fluence', 22000.00, 0, 5),
  ('F/P Jeu de silent bloc barre stabilisation', 'Fluence', 9500.00, 0, 5),
  ('F/P Joint de cache culbuteur', 'Fluence', 3000.00, 0, 5),
  ('F/P Joint de culasse', 'Fluence', 5000.00, 0, 5),
  ('F/P Joint de spi arbre a came', 'Fluence', 14000.00, 0, 5),
  ('F/P Kit chaine de distribution Y Compris les courroies', 'Fluence', 22000.00, 0, 5),
  ('F/P Kit d''embrayage (plateau+ disque+butée)', 'Fluence', 37000.00, 0, 5),
  ('F/P lampe 01 plot', 'Fluence', 200.00, 0, 5),
  ('F/P lampe 02 plot', 'Fluence', 200.00, 0, 5),
  ('F/P lampe de 12 volte', 'Fluence', 250.00, 0, 5),
  ('F/P Lampe de Code et Phare', 'Fluence', 250.00, 0, 5),
  ('F/P Lanceur démarreur (bain disque)', 'Fluence', 2500.00, 0, 5),
  ('Liquide de refroidissement GLACEOL (5Litre) G12 OU G13', 'Fluence', 3000.00, 0, 5),
  ('F/P Maitre cylindre de frein', 'Fluence', 15000.00, 0, 5),
  ('F/P Manchon de cardon', 'Fluence', 7800.00, 0, 5),
  ('F/P Moteur de monte de glace', 'Fluence', 41000.00, 0, 5),
  ('F/P Moteur lave glace', 'Fluence', 46000.00, 0, 5),
  ('F/P Moyeu arrière', 'Fluence', 28000.00, 0, 5),
  ('F/P Moyeu avant', 'Fluence', 15000.00, 0, 5),
  ('F/P Nécessaire maître cylindre de frein', 'Fluence', 5000.00, 0, 5),
  ('F/P Nécessaire pompe de frein', 'Fluence', 5000.00, 0, 5),
  ('Parallélisme', 'Fluence', 2500.00, 0, 5),
  ('F/P Pipe d''eau', 'Fluence', 10500.00, 0, 5),
  ('F/P Piston de frein arrière', 'Fluence', 14000.00, 0, 5),
  ('F/P Plaquette de frein arrière', 'Fluence', 9000.00, 0, 5),
  ('F/P Plaquette de frein avant', 'Fluence', 8000.00, 0, 5),
  ('F/P Poignet extérieur de porte', 'Fluence', 6000.00, 0, 5),
  ('F/P Poignet intérieur de porte', 'Fluence', 5000.00, 0, 5),
  ('F/P Pompe à eau', 'Fluence', 13000.00, 0, 5),
  ('F/P Pompe à essence', 'Fluence', 10000.00, 0, 5),
  ('F/P Pompe de frein', 'Fluence', 15000.00, 0, 5),
  ('F/P Porte charbon démarreur', 'Fluence', 5000.00, 0, 5),
  ('Rabotage Bloc y compris réparation mécanique', 'Fluence', 8000.00, 0, 5),
  ('Rabotage culasse y compris réparation mécanique', 'Fluence', 5000.00, 0, 5),
  ('Débouchage Radiateur', 'Fluence', 3000.00, 0, 5),
  ('F/P Refroidisseur d''huile', 'Fluence', 13000.00, 0, 5),
  ('F/P Régulateur alternateur', 'Fluence', 9800.00, 0, 5),
  ('Réparation boite à vitesse', 'Fluence', 25000.00, 0, 5),
  ('F/P Rétroviseur', 'Fluence', 10000.00, 0, 5),
  ('F/P rotule de direction', 'Fluence', 10000.00, 0, 5),
  ('F/P rotule de fusée', 'Fluence', 10000.00, 0, 5),
  ('F/P Roulement alternateur', 'Fluence', 7000.00, 0, 5),
  ('F/P Roulement de roue', 'Fluence', 13000.00, 0, 5),
  ('F/P Roulement de tasseau', 'Fluence', 11000.00, 0, 5),
  ('F/P Serrure porte', 'Fluence', 22000.00, 0, 5),
  ('F/P Soufflet de cardon cote boite', 'Fluence', 8500.00, 0, 5),
  ('F/P Soufflet de cardon cote roue', 'Fluence', 7500.00, 0, 5),
  ('F/P Support boite a vitesse', 'Fluence', 9000.00, 0, 5),
  ('F/P Support moteur', 'Fluence', 9000.00, 0, 5),
  ('F/P Tasseau', 'Fluence', 8500.00, 0, 5),
  ('F/P Thermostat', 'Fluence', 8000.00, 0, 5),
  ('F/P Tirant de suspension', 'Fluence', 6800.00, 0, 5),
  ('F/P Triangle de suspension', 'Fluence', 16000.00, 0, 5),
  ('F/P Vase d''eau', 'Fluence', 10000.00, 0, 5),
  ('F/P Ventilateur', 'Fluence', 22000.00, 0, 5),
  ('F/P Radiateur', 'Fluence', 23000.00, 0, 5),
  ('F/P Radiateur de climatiseur', 'Fluence', 24000.00, 0, 5),
  ('F/P Feux AR Gauche', 'Fluence', 12000.00, 0, 5),
  ('F/P Feux AR Droite', 'Fluence', 12000.00, 0, 5),
  ('F/P Intérrupteur Doublé', 'Fluence', 7000.00, 0, 5),
  ('F/P Vitre parprise', 'Fluence', 43500.00, 0, 5),
  ('Main d''œuvre tolier', 'Fluence', 2000.00, 0, 5),
  ('Main d''œuvre électricité', 'Fluence', 1800.00, 0, 5),
  ('Vidange Huile moteur (5L Huile CASTROL + Rondelle d''étanchéité + main d''œuvre)', 'Fluence', 6000.00, 0, 5)
`);
    connection.release();
    console.log("✅ Database initialized (no duplicate inserts)");
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};


