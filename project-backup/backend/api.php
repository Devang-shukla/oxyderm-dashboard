<?php
// Oxyderm Agent Memory API
// Deploy to: /home2/oxydenic/public_html/oxydermlaserclinic.ca/api/
// Access at: https://oxydermlaserclinic.ca/api/api.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// Auth
$API_KEY = 'REDACTED_SET_VIA_SECRETS_ENV';
$provided = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['key'] ?? '';
if ($provided !== $API_KEY) { http_response_code(401); echo json_encode(['error'=>'Unauthorized']); exit; }

// DB
$db_host = 'localhost';
$db_name = 'oxydenic_WP3DT';
$db_user = 'oxydenic_ai';
$db_pass = '!3n0vD4*XW+SU!pH';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    http_response_code(500); echo json_encode(['error'=>'DB connection failed: '.$e->getMessage()]); exit;
}

// Init tables
$pdo->exec("CREATE TABLE IF NOT EXISTS agent_memory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    content TEXT NOT NULL,
    source VARCHAR(100),
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_agent (agent),
    INDEX idx_category (agent, category)
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS competitor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competitor VARCHAR(100) NOT NULL,
    data_type VARCHAR(50),
    content TEXT,
    source_url VARCHAR(500),
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_competitor (competitor)
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(100) UNIQUE,
    client_name VARCHAR(200),
    phone VARCHAR(50),
    email VARCHAR(200),
    service VARCHAR(200),
    notes TEXT,
    appt_date DATE,
    appt_time VARCHAR(20),
    duration_min INT,
    status VARCHAR(50),
    visit_num INT,
    payment_notes TEXT,
    flags TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (appt_date),
    INDEX idx_booking (booking_id)
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS content_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform VARCHAR(100),
    caption TEXT,
    hashtags TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_at DATETIME,
    posted_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Router
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $action ?: ($input['action'] ?? '');

switch ($action) {

    // ── MEMORY ──────────────────────────────────────
    case 'memory_get':
        $agent = $_GET['agent'] ?? $input['agent'] ?? '';
        $category = $_GET['category'] ?? $input['category'] ?? '';
        $sql = 'SELECT * FROM agent_memory WHERE 1=1';
        $params = [];
        if ($agent) { $sql .= ' AND agent = ?'; $params[] = $agent; }
        if ($category) { $sql .= ' AND category = ?'; $params[] = $category; }
        $sql .= ' ORDER BY updated_at DESC LIMIT 200';
        $stmt = $pdo->prepare($sql); $stmt->execute($params);
        echo json_encode(['ok'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;

    case 'memory_set':
        $agent    = $input['agent'] ?? '';
        $category = $input['category'] ?? '';
        $content  = $input['content'] ?? '';
        $source   = $input['source'] ?? 'agent';
        if (!$agent || !$content) { echo json_encode(['error'=>'agent and content required']); break; }
        // Upsert by agent+category
        $stmt = $pdo->prepare('SELECT id FROM agent_memory WHERE agent=? AND category=? LIMIT 1');
        $stmt->execute([$agent, $category]);
        $existing = $stmt->fetch();
        if ($existing) {
            $pdo->prepare('UPDATE agent_memory SET content=?, source=?, updated_at=NOW() WHERE id=?')
                ->execute([$content, $source, $existing['id']]);
            echo json_encode(['ok'=>true,'action'=>'updated','id'=>$existing['id']]);
        } else {
            $pdo->prepare('INSERT INTO agent_memory (agent,category,content,source) VALUES (?,?,?,?)')
                ->execute([$agent, $category, $content, $source]);
            echo json_encode(['ok'=>true,'action'=>'inserted','id'=>$pdo->lastInsertId()]);
        }
        break;

    case 'memory_append':
        $agent    = $input['agent'] ?? '';
        $category = $input['category'] ?? '';
        $content  = $input['content'] ?? '';
        if (!$agent || !$content) { echo json_encode(['error'=>'agent and content required']); break; }
        $stmt = $pdo->prepare('SELECT id, content FROM agent_memory WHERE agent=? AND category=? LIMIT 1');
        $stmt->execute([$agent, $category]);
        $existing = $stmt->fetch();
        if ($existing) {
            $new = $existing['content'] . "\n" . date('Y-m-d H:i') . ': ' . $content;
            $pdo->prepare('UPDATE agent_memory SET content=?, updated_at=NOW() WHERE id=?')
                ->execute([$new, $existing['id']]);
        } else {
            $pdo->prepare('INSERT INTO agent_memory (agent,category,content,source) VALUES (?,?,?,?)')
                ->execute([$agent, $category, date('Y-m-d H:i').': '.$content, $input['source']??'agent']);
        }
        echo json_encode(['ok'=>true]);
        break;

    // ── APPOINTMENTS ─────────────────────────────────
    case 'appointments_sync':
        $appts = $input['appointments'] ?? [];
        $date  = $input['date'] ?? date('Y-m-d');
        $synced = 0;
        foreach ($appts as $a) {
            $pdo->prepare('INSERT INTO appointments (booking_id,client_name,phone,email,service,notes,appt_date,appt_time,duration_min,status,visit_num,payment_notes,flags,synced_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
                ON DUPLICATE KEY UPDATE client_name=VALUES(client_name),phone=VALUES(phone),service=VALUES(service),notes=VALUES(notes),appt_time=VALUES(appt_time),duration_min=VALUES(duration_min),status=VALUES(status),synced_at=NOW()')
                ->execute([
                    $a['booking_id']??uniqid(), $a['name']??'', $a['phone']??'', $a['email']??'',
                    $a['service']??'', $a['raw_note']??'', $a['date']??$date, $a['time']??'',
                    $a['duration_min']??60, $a['status']??'ACCEPTED', $a['visit_num']??null,
                    $a['payment']??'', json_encode($a['flags']??[])
                ]);
            $synced++;
        }
        echo json_encode(['ok'=>true,'synced'=>$synced,'date'=>$date]);
        break;

    case 'appointments_get':
        $date = $_GET['date'] ?? $input['date'] ?? date('Y-m-d');
        $stmt = $pdo->prepare('SELECT * FROM appointments WHERE appt_date=? ORDER BY appt_time ASC');
        $stmt->execute([$date]);
        echo json_encode(['ok'=>true,'date'=>$date,'appointments'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;

    // ── COMPETITOR ───────────────────────────────────
    case 'competitor_save':
        $comp    = $input['competitor'] ?? '';
        $type    = $input['data_type'] ?? 'general';
        $content = $input['content'] ?? '';
        $url     = $input['source_url'] ?? '';
        if (!$comp || !$content) { echo json_encode(['error'=>'competitor and content required']); break; }
        $pdo->prepare('INSERT INTO competitor_data (competitor,data_type,content,source_url) VALUES (?,?,?,?)')
            ->execute([$comp,$type,$content,$url]);
        echo json_encode(['ok'=>true,'id'=>$pdo->lastInsertId()]);
        break;

    case 'competitor_get':
        $comp = $_GET['competitor'] ?? $input['competitor'] ?? '';
        $sql = 'SELECT * FROM competitor_data';
        $params = [];
        if ($comp) { $sql .= ' WHERE competitor=?'; $params[] = $comp; }
        $sql .= ' ORDER BY scraped_at DESC LIMIT 100';
        $stmt = $pdo->prepare($sql); $stmt->execute($params);
        echo json_encode(['ok'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;

    // ── CONTENT LOG ──────────────────────────────────
    case 'content_save':
        $pdo->prepare('INSERT INTO content_log (platform,caption,hashtags,status,scheduled_at) VALUES (?,?,?,?,?)')
            ->execute([$input['platform']??'',$input['caption']??'',$input['hashtags']??'',$input['status']??'pending',$input['scheduled_at']??null]);
        echo json_encode(['ok'=>true,'id'=>$pdo->lastInsertId()]);
        break;

    case 'content_get':
        $status = $_GET['status'] ?? $input['status'] ?? '';
        $sql = 'SELECT * FROM content_log';
        $params = [];
        if ($status) { $sql .= ' WHERE status=?'; $params[] = $status; }
        $sql .= ' ORDER BY scheduled_at ASC LIMIT 100';
        $stmt = $pdo->prepare($sql); $stmt->execute($params);
        echo json_encode(['ok'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;

    case 'content_mark_posted':
        $id = $input['id'] ?? 0;
        $pdo->prepare('UPDATE content_log SET status="posted", posted_at=NOW() WHERE id=?')->execute([$id]);
        echo json_encode(['ok'=>true]);
        break;

    // ── HEALTH ───────────────────────────────────────
    case 'health':
    default:
        $tables = [];
        foreach (['agent_memory','competitor_data','appointments','content_log'] as $t) {
            $c = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
            $tables[$t] = (int)$c;
        }
        echo json_encode(['ok'=>true,'status'=>'healthy','server'=>'gator4140.hostgator.com','tables'=>$tables,'time'=>date('c')]);
        break;
}
