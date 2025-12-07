-- HealthTrack Personal Wellness Platform Database Schema
-- MySQL Database Setup

CREATE DATABASE IF NOT EXISTS healthtrack;
USE healthtrack;

-- Users table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    health_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User emails (multiple emails per user)
CREATE TABLE user_emails (
    email_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_email (email)
);

-- Healthcare providers
CREATE TABLE providers (
    provider_id INT PRIMARY KEY AUTO_INCREMENT,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    specialty VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-provider relationships
CREATE TABLE user_providers (
    user_provider_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlinked_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(provider_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_provider (user_id, provider_id)
);

-- Family groups
CREATE TABLE family_groups (
    family_id INT PRIMARY KEY AUTO_INCREMENT,
    group_name VARCHAR(100),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Family group members
CREATE TABLE family_members (
    family_member_id INT PRIMARY KEY AUTO_INCREMENT,
    family_id INT NOT NULL,
    user_id INT NOT NULL,
    relationship VARCHAR(50),
    can_manage BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES family_groups(family_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_family_member (family_id, user_id)
);

-- Appointments
CREATE TABLE appointments (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_uid VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    consultation_type ENUM('In-Person', 'Virtual') NOT NULL,
    memo TEXT,
    status ENUM('scheduled', 'cancelled', 'completed') DEFAULT 'scheduled',
    cancellation_reason VARCHAR(255),
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(provider_id) ON DELETE CASCADE
);

-- Wellness challenges
CREATE TABLE wellness_challenges (
    challenge_id INT PRIMARY KEY AUTO_INCREMENT,
    challenge_uid VARCHAR(50) UNIQUE NOT NULL,
    created_by INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    goal VARCHAR(500) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Challenge participants
CREATE TABLE challenge_participants (
    participant_id INT PRIMARY KEY AUTO_INCREMENT,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    progress INT DEFAULT 0,
    progress_notes TEXT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES wellness_challenges(challenge_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_challenge_participant (challenge_id, user_id)
);

-- Invitations
CREATE TABLE invitations (
    invitation_id INT PRIMARY KEY AUTO_INCREMENT,
    invitation_uid VARCHAR(50) UNIQUE NOT NULL,
    sent_by INT NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    invitation_type ENUM('challenge', 'family', 'data_share', 'platform') NOT NULL,
    related_id INT, -- challenge_id or family_id
    status ENUM('pending', 'accepted', 'expired', 'cancelled') DEFAULT 'pending',
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 15 DAY),
    FOREIGN KEY (sent_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Health metrics (for monthly reports)
CREATE TABLE health_metrics (
    metric_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, metric_date)
);

-- Insert sample data
INSERT INTO users (health_id, name, phone, phone_verified, password_hash) VALUES
('HT001', 'John Doe', '+1234567890', TRUE, '$2a$10$YourHashedPasswordHere'),
('HT002', 'Jane Smith', '+0987654321', TRUE, '$2a$10$YourHashedPasswordHere'),
('HT003', 'Bob Johnson', '+1122334455', FALSE, '$2a$10$YourHashedPasswordHere');

INSERT INTO user_emails (user_id, email, verified, is_primary) VALUES
(1, 'john.doe@example.com', TRUE, TRUE),
(1, 'john.doe.work@example.com', FALSE, FALSE),
(2, 'jane.smith@example.com', TRUE, TRUE),
(3, 'bob.johnson@example.com', FALSE, TRUE);

INSERT INTO providers (license_number, name, email, phone, specialty, verified) VALUES
('MD123456', 'Dr. Sarah Wilson', 'sarah.wilson@hospital.com', '+15551234567', 'General Practitioner', TRUE),
('MD789012', 'Dr. Michael Chen', 'michael.chen@clinic.com', '+15559876543', 'Cardiologist', TRUE),
('MD345678', 'Dr. Emily Brown', 'emily.brown@wellness.com', '+15551122334', 'Nutritionist', FALSE);

INSERT INTO user_providers (user_id, provider_id, is_primary, verified) VALUES
(1, 1, TRUE, TRUE),
(1, 2, FALSE, TRUE),
(2, 1, TRUE, TRUE),
(3, 3, TRUE, FALSE);

INSERT INTO family_groups (group_name, created_by) VALUES
('Doe Family', 1);

INSERT INTO family_members (family_id, user_id, relationship, can_manage) VALUES
(1, 1, 'Parent', TRUE),
(1, 2, 'Spouse', TRUE),
(1, 3, 'Child', FALSE);

INSERT INTO appointments (appointment_uid, user_id, provider_id, appointment_date, appointment_time, consultation_type, memo) VALUES
('APT001', 1, 1, '2024-12-15', '10:00:00', 'In-Person', 'Annual checkup'),
('APT002', 2, 1, '2024-12-16', '14:30:00', 'Virtual', 'Follow-up consultation');

INSERT INTO wellness_challenges (challenge_uid, created_by, title, description, goal, start_date, end_date) VALUES
('CHL001', 1, 'December Fitness Challenge', 'Get active this December!', 'Walk 100 miles in a month', '2024-12-01', '2024-12-31'),
('CHL002', 2, 'Hydration Goal', 'Stay hydrated daily', 'Drink 2 liters of water daily for 30 days', '2024-12-01', '2024-12-30');

INSERT INTO challenge_participants (challenge_id, user_id, progress) VALUES
(1, 1, 25),
(1, 2, 30),
(1, 3, 15),
(2, 2, 28);

INSERT INTO health_metrics (user_id, metric_date, metric_type, value, unit) VALUES
(1, '2024-12-01', 'steps', 8500, 'steps'),
(1, '2024-12-01', 'weight', 75.5, 'kg'),
(1, '2024-12-02', 'steps', 9200, 'steps'),
(2, '2024-12-01', 'steps', 10500, 'steps'),
(2, '2024-12-01', 'weight', 62.3, 'kg');