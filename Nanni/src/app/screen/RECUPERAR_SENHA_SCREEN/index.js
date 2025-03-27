import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from "react-native";
import styles from "./style"; 

const RecuperarSenha = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [isEnviandoEmail, setIsEnviandoEmail] = useState(false);

  const handleEnviarEmail = async () => {
    if (isEnviandoEmail) return;
    
    if (!email) {
      Alert.alert("Erro", "Por favor, informe seu e-mail.");
      return;
    }

    try {
      setIsEnviandoEmail(true);
      
      // Envia email de redefinição de senha usando Firebase
      await auth.sendPasswordResetEmail(email);
      
      showToast(
        'Email enviado!',
        `Verifique sua caixa de entrada em ${email}`
      );
      
    } catch (error) {
      let mensagemErro = "Ocorreu um erro ao enviar o email. Tente novamente.";
      
      switch (error.code) {
        case "auth/user-not-found":
          mensagemErro = "Nenhum usuário encontrado com este email.";
          break;
        case "auth/invalid-email":
          mensagemErro = "Endereço de email inválido.";
          break;
        case "auth/too-many-requests":
          mensagemErro = "Muitas tentativas. Tente novamente mais tarde.";
          break;
      }
      
      showToast(
        'Email enviado!',
        mensagemErro
      );
    } finally {
      setIsEnviandoEmail(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Recuperar Senha</Text>

        <Text style={styles.subtitulo}>Informe seu e-mail para receber o código de recuperação.</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#A349A4"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity
          style={styles.botao}
          onPress={handleEnviarEmail}
          disabled={isEnviandoEmail}
        >
          {isEnviandoEmail ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.botaoTexto}>Enviar Código</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RecuperarSenha;