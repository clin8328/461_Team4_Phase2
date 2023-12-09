-- CREATE DATABASE IF NOT EXISTS mydb;
-- USE mydb;

-- Create auth table with user authentication info
CREATE TABLE Auth (
    user varchar(32),
    pass varchar(64), 
    canSearch BOOL, 
    canUpload BOOL, 
    canDownload BOOL, 
    isAdmin BOOL
) ENGINE=InnoDB;

-- add default user
-- INSERT INTO Auth VALUES (
--     "ece30861defaultadminuser",
--     "correcthorsebatterystaple123(!__+@**(A;DROP TABLE packages",
--     1,
--     1,
--     1,
--     1
-- )

-- Create Package table with foreign keys to PackageMetadata and PackageData
CREATE TABLE Package (
    PackageID INT AUTO_INCREMENT PRIMARY KEY
) ENGINE=InnoDB;

-- Create PackageMetadata table
CREATE TABLE PackageMetadata (
    ID INT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Version VARCHAR(20) NOT NULL,
    UNIQUE (Name, Version),
    FOREIGN KEY (ID) REFERENCES Package(PackageID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Create PackageData table
CREATE TABLE PackageData (
    ID INT PRIMARY KEY,
    Content LONGTEXT,
    README LONGTEXT,
    URL VARCHAR(255),
    JSProgram LONGTEXT,
    FOREIGN KEY (ID) REFERENCES Package(PackageID) ON DELETE CASCADE
) ENGINE=InnoDB;
-- Drop the existing procedure if it exists
DROP PROCEDURE IF EXISTS InsertPackage;

DELIMITER //
CREATE PROCEDURE InsertPackage(
    IN Name VARCHAR(255),
    IN Version VARCHAR(20),
    IN Content LONGTEXT,
    IN README LONGTEXT,
    IN URL VARCHAR(255),
    IN JSProgram LONGTEXT
)
BEGIN
  DECLARE package_id INT;

--   DECLARE duplicate_error CONDITION FOR SQLSTATE '23000'; -- Specific SQLSTATE for duplicate entry
--   DECLARE EXIT HANDLER FOR duplicate_error
  DECLARE EXIT HANDLER FOR 1062
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Duplicate entry occurred';
    END;
    
  START TRANSACTION;

  INSERT INTO Package ()
  VALUES();

  SET @package_id = LAST_INSERT_ID();

  -- Insert data into PackageMetadata
  INSERT INTO PackageMetadata (ID, Name, Version)
  VALUES (@package_id, Name, Version);

  -- Insert data into PackageData
  INSERT INTO PackageData (ID, Content, JSProgram, README, URL)
  VALUES (@package_id, Content, JSProgram, README, URL);

  -- Select the last inserted ID
  SELECT @packageID as packageID;

  COMMIT;
END;

//
DELIMITER ;

-- Drop the existing procedure if it exists
DROP PROCEDURE IF EXISTS GetPackage;

DELIMITER //
CREATE PROCEDURE GetPackage(IN PackageID INT)
BEGIN
    SELECT 
        JSON_OBJECT(
            'Name', pm.Name,
            'Version', pm.Version,
            'ID', pm.ID
        ) as metadata,
        JSON_OBJECT(
            'Content', pd.Content
        ) as data
    FROM Package AS p
    JOIN PackageMetadata AS pm ON p.PackageID = pm.ID
    JOIN PackageData AS pd ON p.PackageID = pd.ID
    WHERE p.PackageID = PackageID;
END;
// 
DELIMITER ;

DROP PROCEDURE IF EXISTS PackageDelete;

DELIMITER //

CREATE PROCEDURE PackageDelete(IN p_PackageID INT)
BEGIN
    -- Delete from Package (and cascade to PackageMetadata and PackageData)
    DELETE FROM Package
    WHERE PackageID = p_PackageID;
END;

//
DELIMITER ;

DROP PROCEDURE IF EXISTS PackageUpdate;
DELIMITER //
CREATE PROCEDURE PackageUpdate(
    IN p_ID INT,
    IN p_Name VARCHAR(255),
    IN p_Version VARCHAR(20),
    IN p_Content LONGTEXT,
    IN p_URL VARCHAR(255),
    IN p_JSProgram LONGTEXT
)
BEGIN
    -- Check if the record exists in PackageMetadata
    DECLARE record_exists INT;

    SELECT COUNT(*) INTO record_exists
    FROM PackageMetadata
    WHERE ID = p_ID AND Name = p_Name AND Version = p_Version;

    SELECT record_exists as updateSuccess;

    -- If the record exists, update PackageData
    IF record_exists > 0 THEN
        UPDATE PackageData
        SET Content = CASE WHEN p_Content IS NOT NULL THEN p_Content ELSE Content END,
            URL = CASE WHEN p_URL IS NOT NULL THEN p_URL ELSE URL END,
            JSProgram = CASE WHEN p_JSProgram IS NOT NULL THEN p_JSProgram ELSE JSProgram END
        WHERE ID = p_ID;
    -- ELSE
    --     -- Handle the case where the record does not exist (optional)
    --     -- You may choose to raise an error, log a message, etc.
    --     -- This depends on your specific requirements.
    --     SIGNAL SQLSTATE '45000'
    --         SET MESSAGE_TEXT = 'Record not found in PackageMetadata';
    END IF;

    -- UPDATE PackageData
    -- SET Content = p_Content,
    --     URL = p_URL,
    --     JSProgram = p_JSProgram
    -- FROM PackageData
    -- JOIN PackageMetadata ON PackageData.ID = PackageMetadata.ID
    -- WHERE PackageData.ID = p_ID
    -- AND PackageMetadata.Name = p_Name
    -- AND PackageMetadata.Version = p_Version;


END;
//
DELIMITER ;
