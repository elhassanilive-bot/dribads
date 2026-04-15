 = Get-ChildItem -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx,*.md,*.css,*.sql | Where-Object { .FullName -notmatch '\\' + '.git' }
foreach ( in ) {
   = Get-Content -LiteralPath .FullName -Raw
   = .Replace('???????','??????').Replace('??????','??????').Replace('Dribdo','Dridoud').Replace('dribdo','Dridoud')
  if ( -ne ) {
    Set-Content -LiteralPath .FullName -Value  -Encoding utf8
  }
}
