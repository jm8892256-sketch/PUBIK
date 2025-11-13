<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PUBIKE - Agendamento</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
        // Importações do Firebase
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // Configurações globais (fornecidas pelo ambiente)
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null; // CORRIGIDO: Referencia agora o valor global correto

        let db, auth;
        let userId = 'anon-user'; // ID temporário até a autenticação

        setLogLevel('Debug');

        // Função de utilidade para mostrar mensagens de status
        function showMessage(message, type = 'success') {
            const messageBox = document.getElementById('messageBox');
            messageBox.textContent = message;
            // Remove classes antigas de sucesso (verde) e erro (vermelho) e as de estado "hidden"
            messageBox.classList.remove('hidden', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800'); 

            if (type === 'error') {
                messageBox.classList.add('bg-red-100', 'text-red-800');
            } else {
                // Usa azul para sucesso
                messageBox.classList.add('bg-blue-100', 'text-blue-800');
            }
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                messageBox.classList.add('hidden');
            }, 5000);
        }

        // 1. Inicialização do Firebase e Autenticação
        async function initializeFirebase() {
            if (!firebaseConfig) {
                console.error("Firebase config not found.");
                showMessage("Erro: Configuração do Firebase não encontrada.", 'error');
                return;
            }
            
            try {
                const app = initializeApp(firebaseConfig);
                db = getFirestore(app);
                auth = getAuth(app);

                // Tenta autenticar com token personalizado, se não, anonimamente
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
                
                userId = auth.currentUser?.uid || 'anon-' + crypto.randomUUID();
                console.log("Firebase inicializado. User ID:", userId);

            } catch (error) {
                console.error("Erro na inicialização ou autenticação do Firebase:", error);
                showMessage("Erro ao conectar ao serviço de agendamento.", 'error');
            }
        }

        // 2. Função para Agendar o Serviço
        async function scheduleAppointment(event) {
            event.preventDefault();

            if (!db) {
                showMessage("O sistema de agendamento não está pronto. Tente novamente.", 'error');
                return;
            }
            
            const form = event.target;
            const submitButton = document.getElementById('submitButton');
            
            submitButton.disabled = true;
            submitButton.textContent = 'Agendando...';

            // Coleta de dados do formulário
            const appointmentData = {
                serviceType: form.serviceType.value,
                userName: form.userName.value.trim(),
                contactInfo: form.contactInfo.value.trim(),
                preferredDate: form.preferredDate.value,
                preferredTime: form.preferredTime.value,
                notes: form.notes.value.trim(),
                status: 'Pendente',
                userId: userId, // Para rastrear quem agendou
                createdAt: serverTimestamp(),
                // Metadados do condomínio
                condominio: "Parque Universitário",
                serviceProvider: "Jeferson" // ALTERADO: Apenas Jeferson
            };

            // Validação básica
            if (!appointmentData.serviceType || !appointmentData.userName || !appointmentData.contactInfo || !appointmentData.preferredDate || !appointmentData.preferredTime) {
                showMessage("Por favor, preencha todos os campos obrigatórios.", 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Agendar Serviço';
                return;
            }

            // Path público para que Jeferson (o provedor) possa ver todos os agendamentos
            const collectionPath = `artifacts/${appId}/public/data/appointments`;

            try {
                // Adiciona o documento à coleção
                const docRef = await addDoc(collection(db, collectionPath), appointmentData);
                
                // Sucesso
                showMessage(`Serviço agendado com sucesso! Código: ${docRef.id.substring(0, 8)}. Jeferson entrará em contato.`);
                form.reset(); // Limpa o formulário

            } catch (e) {
                console.error("Erro ao adicionar agendamento: ", e);
                showMessage("Erro ao agendar. Por favor, verifique sua conexão.", 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Agendar Serviço';
            }
        }

        // Iniciar Firebase na carga da janela
        window.onload = function () {
            initializeFirebase();
            document.getElementById('appointmentForm').addEventListener('submit', scheduleAppointment);
        }
    </script>
    <style>
        /* Define a fonte Inter (padrão) */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f7f9fb; /* Cor de fundo suave */
        }
    </style>
</head>
<body class="min-h-screen p-4 flex items-center justify-center">

    <!-- Container Principal do Formulário -->
    <div class="w-full max-w-lg bg-white shadow-2xl rounded-xl p-6 md:p-8 border-t-4 border-blue-500">
        
        <!-- Cabeçalho -->
        <header class="text-center mb-6">
            <h1 class="text-3xl font-extrabold text-gray-900 flex items-center justify-center">
                <span class="mr-2 text-blue-600">🚲</span> PUBIKE
            </h1>
            <p class="text-lg text-gray-600 mt-1">Agendamento Exclusivo para o Parque Universitário</p>
            <p class="text-sm text-gray-500 mt-1">Seu mecânico, **Jeferson**, mora aqui!</p>
        </header>

        <!-- Mensagem de Status (sucesso/erro) -->
        <div id="messageBox" role="alert" class="hidden p-3 mb-4 rounded-lg font-medium transition duration-300">
            <!-- Mensagens aparecerão aqui -->
        </div>

        <!-- Formulário de Agendamento -->
        <form id="appointmentForm" class="space-y-4">
            
            <!-- 1. Seleção de Serviço -->
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label for="serviceType" class="block text-sm font-bold text-gray-700 mb-2">
                    Tipo de Serviço Necessário <span class="text-red-500">*</span>
                </label>
                <select id="serviceType" name="serviceType" required
                    class="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm transition duration-150 ease-in-out">
                    <option value="">-- Selecione um Serviço --</option>
                    <option value="Revisão Geral">Revisão Geral (Limpeza + Regulagens + Checagem de itens de segurança)</option>
                    <option value="Regulagem Freios/Marchas">Regulagem de Freios e Marchas (Para problemas de troca ou frenagem)</option>
                    <option value="Reparo Pneu/Câmara">Reparo de Pneu ou Troca de Câmara de Ar (Pneu furado ou murcho)</option>
                    <option value="Limpeza e Lubrificação">Limpeza e Lubrificação da Relação (Corrente, cassete e coroas)</option>
                    <option value="Orçamento/Diagnóstico">Apenas Orçamento e Diagnóstico (Se não souber o problema)</option>
                    <option value="Outro">Outro (Especifique nas Notas)</option>
                </select>
                <p class="text-xs text-gray-500 mt-2">Dica: A **Revisão Geral** é a mais completa e garante a segurança da sua pedalada.</p>
            </div>

            <!-- 2. Dados de Contato -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="userName" class="block text-sm font-medium text-gray-700">Seu Nome Completo <span class="text-red-500">*</span></label>
                    <input type="text" id="userName" name="userName" required placeholder="Ex: Maria da Silva"
                        class="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="contactInfo" class="block text-sm font-medium text-gray-700">Apto. e Telefone/WhatsApp <span class="text-red-500">*</span></label>
                    <input type="text" id="contactInfo" name="contactInfo" required placeholder="Ex: 305-B / (11) 99876-5432"
                        class="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Será usado para Jeferson confirmar o agendamento.</p>
                </div>
            </div>

            <!-- 3. Preferência de Data e Hora -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="preferredDate" class="block text-sm font-medium text-gray-700">Data Preferida para Atendimento <span class="text-red-500">*</span></label>
                    <input type="date" id="preferredDate" name="preferredDate" required
                        class="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="preferredTime" class="block text-sm font-medium text-gray-700">Horário Preferido <span class="text-red-500">*</span></label>
                    <input type="time" id="preferredTime" name="preferredTime" required min="08:00" max="18:00"
                        class="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Horário de atendimento: 08:00 às 18:00.</p>
                </div>
            </div>

            <!-- 4. Notas Adicionais -->
            <div>
                <label for="notes" class="block text-sm font-medium text-gray-700">Detalhes Adicionais sobre a Bike/Problema (Opcional)</label>
                <textarea id="notes" name="notes" rows="3" placeholder="Ex: A marcha 3 está pulando. É uma Mountain Bike aro 29."
                    class="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>

            <!-- 5. Botão de Envio -->
            <button type="submit" id="submitButton"
                class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-xl text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed">
                Agendar Serviço
            </button>
            
            <p class="text-center text-sm text-gray-600 mt-4 font-semibold">
                🔔 Próximos passos: Jeferson receberá seu pedido e te chamará no WhatsApp em até 1 hora útil para confirmar data, horário e local do serviço.
            </p>

        </form>
    </div>
</body>
</html>