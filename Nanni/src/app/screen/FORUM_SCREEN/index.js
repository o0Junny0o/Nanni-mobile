import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Modal,
  TextInput,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { styles } from './styles';
import PropTypes from 'prop-types';
import BotaoPadrao from '../../components/buttons/BotaoPadrao/index';
import { useAuth } from '../../components/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../service/firebase/conexao';
import forumList from '../../../hooks/forum/forumList';
import forumCreate from '../../../hooks/forum/forumCreate';
import forumDelete from '../../../hooks/forum/forumDelete';
import forumUpdate from '../../../hooks/forum/forumUpdate';
import Forum from '../../../model/Forum';

import { deconvertBase64ToImage } from '../../../utils/Base64Image';

const ForumScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [filtrosAtivos, setFiltrosAtivos] = useState({
    maisVistos: false,
    maisRecentes: false,
  });

  const [topicos, setTopicos] = useState([]);
  const [topicoTitle, setTopicoTitle] = useState('');
  const [topicoDesc, setTopicoDesc] = useState('');
  const [modal, setModal] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState('');

  // Movido
  const carregarTopicosDoForum = async () => {
    try {
      const listaDeTopicos = await forumList(5); // Carrega os 5 tópicos mais recentes inicialmente
      setTopicos(listaDeTopicos);
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error);
      alert('Erro ao carregar os tópicos do fórum.');
    }
  };

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const userRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) return;

        const data = docSnap.data();

        if (data.avatar) {
          setFotoPerfil(deconvertBase64ToImage(data.avatar) || '');
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar perfil');
      }
    };

    carregarDadosUsuario();
    carregarTopicosDoForum();
  }, [user]);

  const CriarNovoTopico = async () => {
    if (topicoTitle.trim() === '' || topicoDesc.trim() === '') {
      alert('Preencha todos os campos!');
      return;
    }

    if (!user?.uid) {
      alert('Usuário não autenticado.');
      return;
    }

    const novoForumData = new Forum({
      userRef: user.uid,
      forumName: topicoTitle,
      forumDesc: topicoDesc,
      forumRating: 'pg',
    });

    const sucesso = await novoForumData.create();

    if (sucesso) {
      alert('Tópico criado com sucesso!');
      setTopicoTitle('');
      setTopicoDesc('');
      carregarTopicosDoForum()
      setModal(false); // Recarrega a lista após criar um novo tópico
    } else {
      alert('Erro ao criar o tópico. Tente novamente.');
    }
  };

  const aplicarFiltros = () => {
    let topicosFiltrados = [...topicos];

    if (filtrosAtivos.maisVistos) {
      topicosFiltrados.sort(
        (a, b) => (b?.forumRating || 0) - (a?.forumRating || 0),
      );
    } else if (filtrosAtivos.maisRecentes) {
      topicosFiltrados.sort(
        (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
      );
    }

    return topicosFiltrados;
  };

  const handleFiltrar = (filtro) => {
    setFiltrosAtivos((prevState) => ({
      maisVistos: filtro === 'maisVistos' ? !prevState.maisVistos : false,
      maisRecentes: filtro === 'maisRecentes' ? !prevState.maisRecentes : false,
    }));
  };

  const topicosFiltrados = aplicarFiltros();

  const handleDeleteTopico = async (forumID) => {
    if (!user?.uid) {
      alert('Usuário não autenticado.');
      return;
    }

    const sucesso = await forumDelete({ forumID: forumID });
    if (sucesso) {
      alert(`Tópico com ID ${forumID} excluído com sucesso!`);
      carregarTopicosDoForum(); // Recarrega a lista após excluir um tópico
    } else {
      alert('Erro ao excluir o tópico. Verifique as permissões.');
    }
  };

  const handleUpdateTopico = async (forumID, newName, newDesc) => {
    if (!user?.uid) {
      alert('Usuário não autenticado.');
      return;
    }

    const sucesso = await forumUpdate(forumID, user.uid, newName, newDesc);
    if (sucesso) {
      alert(`Tópico com ID ${forumID} atualizado com sucesso!`);
      carregarTopicosDoForum(); // Recarrega a lista após atualizar um tópico
    } else {
      alert('Erro ao atualizar o tópico. Verifique as permissões.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FÓRUM</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PerfilUsuario')}>
          <Image source={fotoPerfil} style={styles.perfilImage} />
        </TouchableOpacity>
      </View>

      {topicos.length === 0 ? (
        <View style={styles.noTopicsContainer}>
          <Text style={styles.noTopicsText}>Ainda não existem Tópicos</Text>
        </View>
      ) : (
        <View style={styles.fullFlex}>
          <View style={styles.filterButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filtrosAtivos.maisVistos && styles.filterButtonActive,
              ]}
              onPress={() => handleFiltrar('maisVistos')}
            >
              <Text style={styles.filterButtonText}>Mais Vistos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filtrosAtivos.maisRecentes && styles.filterButtonActive,
              ]}
              onPress={() => handleFiltrar('maisRecentes')}
            >
              <Text style={styles.filterButtonText}>Mais Recentes</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            showsVerticalScrollIndicator={false}
            data={topicosFiltrados}
            keyExtractor={(item) => item?.forumID}
            renderItem={({ item }) => (
              <View style={styles.forumItem}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('TopicoScreen', {
                      topicoId: item?.forumID,
                      topicoTitle: item?.forumName, // Passando o nome do tópico
                      topicoDesc: item?.forumDesc, // Passando a descrição do tópico
                    })
                  }
                >
                  <Text style={styles.forumName}>{item?.forumName}</Text>
                  <Text style={styles.forumDescription}>
                    Descrição: {item?.forumDesc}
                  </Text>
                  <Text style={styles.forumDescription}>
                    ID: {item?.forumID}
                  </Text>
                </TouchableOpacity>
                {/* Exemplo de botões de deletar e atualizar */}
                <TouchableOpacity
                  onPress={() => handleDeleteTopico(item?.forumID)}
                >
                  <Text style={{ color: 'red', marginTop: 5 }}>Excluir</Text>
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={() => handleUpdateTopico(item?.forumID, 'Novo Nome', 'Nova Descrição')}>
                  <Text style={{ color: 'blue', marginTop: 5 }}>Atualizar</Text>
                </TouchableOpacity> */}
              </View>
            )}
          />
        </View>
      )}

      <Modal visible={modal} transparent>
        <TouchableOpacity
          onPressOut={() => setModal(false)}
          style={styles.modalContainer}
        >
          {/* <TouchableOpacity
            style={styles.modalOverlayTouchable}
            onPress={() => setModal(false)}
          /> */}
          <TouchableWithoutFeedback>
            <View style={styles.modalTopico}>
              <Text style={styles.modalTitle}>Criar Tópico</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Nome do Tópico"
                onChangeText={setTopicoTitle}
                value={topicoTitle}
              />
              <TextInput
                style={styles.modalTextInput}
                placeholder="Descrição"
                onChangeText={setTopicoDesc}
                value={topicoDesc}
              />
              <BotaoPadrao onPress={CriarNovoTopico} text="Criar novo tópico" />
              <BotaoPadrao onPress={() => setModal(false)} text="Cancelar" />
            </View>
          </TouchableWithoutFeedback>
          {/* <TouchableOpacity
            style={styles.modalOverlayTouchable}
            onPress={() => setModal(false)}
          /> */}
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity
        style={styles.createNewForumButton}
        onPress={() => setModal(true)}
      >
        <Text style={styles.createNewForumButtonText}>Novo Tópico</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

ForumScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default ForumScreen;
