#!/bin/bash

# Frontend ve Backend API URL'lerini Production için Güncelleme Scripti

echo "🔧 Frontend API URL'leri güncelleniyor..."

# Frontend: Tüm localhost:3000 referanslarını değiştir
find frontend/public -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i 's|http://localhost:3000/api|/api|g' {} +
find frontend/public -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i "s|'http://localhost:3000'|''|g" {} +
find frontend/public -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i 's|"http://localhost:3000"|""|g' {} +

echo "✅ Frontend tamamlandı!"
echo ""
echo "🔧 Backend hardcoded URL'leri güncelleniyor..."

# Backend: Hardcoded localhost URL'lerini environment variable kullanımına çevir
# masterAuth.controller.js - frontendUrl
sed -i "s|const frontendUrl = 'http://localhost:8080/master';|const frontendUrl = process.env.FRONTEND_URL + '/master';|g" backend/src/modules/master/auth/masterAuth.controller.js
sed -i "s|const frontendUrl =  'http://localhost:3000/master';|const frontendUrl = process.env.FRONTEND_URL + '/master';|g" backend/src/modules/master/auth/masterAuth.controller.js

# invitation.service.js - inviteLink
sed -i "s|const inviteLink = \`http://localhost:3000/register-employee.html?inviteCode=\${inviteCode}\`;|const inviteLink = \`\${process.env.FRONTEND_URL}/register-employee.html?inviteCode=\${inviteCode}\`;|g" backend/src/modules/company/service/invitation.service.js

echo "✅ Backend tamamlandı!"
echo ""
echo "📋 Değiştirilen dosyalar:"
echo "Frontend:"
find frontend/public -type f \( -name "*.js" -o -name "*.html" \) -exec grep -l "/api" {} + | head -10
echo ""
echo "Backend:"
echo "  - backend/src/modules/master/auth/masterAuth.controller.js"
echo "  - backend/src/modules/company/service/invitation.service.js"
echo ""
echo "✅ Tüm URL'ler production için güncellendi!"
