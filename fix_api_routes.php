<?php
$content = file_get_contents("backend/routes/api.php");

$content = preg_replace("/<<<<<<< HEAD\r?\n(.*?)\r?\n=======\r?\n(.*?)\r?\n>>>>>>> [a-f0-9]+\r?\n/ms", "$1\n$2\n", $content);

file_put_contents("backend/routes/api.php", $content);
echo "Fixed";

