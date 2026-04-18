param(
  [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

$apps = @(
  @{ slug = "dribdo";  key = "dribdo_default_key_change_me"  },
  @{ slug = "dridoud"; key = "dridoud_default_key_change_me" }
)

function Get-Analytics($base, $slug, $key) {
  $h = @{ "x-dribads-app-key" = $key }
  return Invoke-RestMethod -Headers $h -Uri "$base/api/analytics?days=14&app=$slug" -Method GET
}

function Get-Ad($base, $slug, $key, $strategy) {
  $h = @{ "x-dribads-app-key" = $key }
  return Invoke-RestMethod -Headers $h -Uri "$base/api/ads?strategy=$strategy&app=$slug" -Method GET
}

function Track($base, $path, $slug, $key, $adId) {
  $h = @{ "Content-Type" = "application/json"; "x-dribads-app-key" = $key }
  $body = @{ ad_id = $adId; app_slug = $slug; app_key = $key } | ConvertTo-Json
  return Invoke-RestMethod -Headers $h -Uri "$base$path" -Method POST -Body $body
}

$final = @()

foreach ($app in $apps) {
  $slug = $app.slug
  $key = $app.key

  $before = Get-Analytics -base $BaseUrl -slug $slug -key $key

  # 1) Regular videos feed-style fetch
  $adLatest = Get-Ad -base $BaseUrl -slug $slug -key $key -strategy "latest"
  if (-not $adLatest.ad) {
    $final += [pscustomobject]@{
      app = $slug
      pass = $false
      reason = "No ad returned from /api/ads"
    }
    continue
  }

  $adId = $adLatest.ad.id

  # 2) Simulate in-feed impressions/clicks
  $v1 = Track -base $BaseUrl -path "/api/ad-view"  -slug $slug -key $key -adId $adId
  $v2 = Track -base $BaseUrl -path "/api/ad-view"  -slug $slug -key $key -adId $adId
  $c1 = Track -base $BaseUrl -path "/api/ad-click" -slug $slug -key $key -adId $adId

  # 3) Simulate reels ad break (fetch random ad, then view+click)
  $adRandom = Get-Ad -base $BaseUrl -slug $slug -key $key -strategy "random"
  $adBreakId = if ($adRandom.ad) { $adRandom.ad.id } else { $adId }
  $v3 = Track -base $BaseUrl -path "/api/ad-view"  -slug $slug -key $key -adId $adBreakId
  $c2 = Track -base $BaseUrl -path "/api/ad-click" -slug $slug -key $key -adId $adBreakId

  Start-Sleep -Milliseconds 500

  $after = Get-Analytics -base $BaseUrl -slug $slug -key $key

  $beforeViews = [int]$before.summary.totalViews
  $afterViews = [int]$after.summary.totalViews
  $beforeClicks = [int]$before.summary.totalClicks
  $afterClicks = [int]$after.summary.totalClicks
  $beforeBalance = [double]$before.summary.balance
  $afterBalance = [double]$after.summary.balance

  $viewsDelta = $afterViews - $beforeViews
  $clicksDelta = $afterClicks - $beforeClicks
  $balanceDelta = [math]::Round(($afterBalance - $beforeBalance), 4)

  $passed = ($v1.ok -and $v2.ok -and $v3.ok -and $c1.ok -and $c2.ok -and $viewsDelta -ge 3 -and $clicksDelta -ge 2)

  $final += [pscustomobject]@{
    app = $slug
    pass = $passed
    ad_latest_id = $adId
    ad_break_id = $adBreakId
    views_before = $beforeViews
    views_after = $afterViews
    views_delta = $viewsDelta
    clicks_before = $beforeClicks
    clicks_after = $afterClicks
    clicks_delta = $clicksDelta
    balance_before = $beforeBalance
    balance_after = $afterBalance
    balance_delta = $balanceDelta
  }
}

$final | ConvertTo-Json -Depth 6
