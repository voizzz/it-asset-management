$body = @{ hostname='test'; category='Monitor'; ipAddress=''; macAddress=''; brand=''; model=''; serialNumber=''; location=''; notes=''; status='online'; currentUser=''; realUser='test' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/api/assets/MON-H4ZN600803' -Method PUT -Body $body -ContentType 'application/json'
