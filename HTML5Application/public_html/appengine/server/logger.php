<?php
date_default_timezone_set("Europe/Rome");
// punto unico di accesso all'applicazione
FrontController::dispatch($_REQUEST);




class FrontController {
    public static $db_host = 'localhost';
    public static $db_user = 'davide';
    public static $db_password = 'chip2017';
    public static $db_name = 'chip';
    
    
    public static function dispatch(&$request) {
        session_start();
        
        if(     isset($request["level"]) && 
                isset($request["solution"]) &&
                isset($request["app"])){
            $mysqli = FrontController::connectDb();
            
            if (!isset($mysqli)) {
                error_log("[logger] impossibile aprire la connessione");
                $mysqli->close();
                return;
            }
            
            $query = "insert into soluzioni 
                            (id, data, soluzione, livello, app, session)
                    values  (default, default, ?, ?, ?, ?)";
            
            $stmt = $mysqli->stmt_init();
            $stmt->prepare($query);
            
            if (!$stmt) {
                error_log("[logger] impossibile inizializzare il prepared statement");
                $mysqli->close();
                return;
            }
            
            if (!$stmt->bind_param('siis', 
                    $request["solution"],
                    filter_var($request['level'], FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE),
                    filter_var($request['app'], FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE),
                    session_id())) {
                error_log("[logger] impossibile effettuare il binding");
                $mysqli->close();
                return;
            }
            
            if (!$stmt->execute()) {
                error_log("[logger] impossibile eseguire l'insert");
                $mysqli->close();
                return ;
            }
            
            header('Cache-Control: no-cache, must-revalidate');
            header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
            header('Content-type: application/json');
            
            $json = array();
            $json['result'] = "ok";
            
            echo json_encode($json);
        }
    }
    
    public static function connectDb(){
        $mysqli = new mysqli();
        $mysqli->connect(FrontController::$db_host, FrontController::$db_user,
        FrontController::$db_password, FrontController::$db_name);
        if($mysqli->errno != 0){
            return null;
        }else{
            return $mysqli;
        }
    }
}
?>
