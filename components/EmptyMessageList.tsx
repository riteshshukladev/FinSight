import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const EmptyMessagesList = ({ 
  loading, 
  isDark, 
  onRefresh, 
  fontsLoaded 
}) => {
  if (loading) {
    return (
      <View style={[styles.emptyContainer, styles.loadingContainer]}>
        <MaterialIcons 
          name="sync" 
          size={48} 
          color={isDark ? "#666" : "#999"} 
          style={styles.loadingIcon}
        />
        <Text style={[
          styles.emptyTitle, 
          isDark && styles.emptyTitleDark,
          fontsLoaded && styles.fontFamily
        ]}>
          Loading Messages...
        </Text>
        <Text style={[
          styles.emptySubtitle, 
          isDark && styles.emptySubtitleDark,
          fontsLoaded && styles.fontFamily
        ]}>
          Scanning your SMS for bank transactions
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <View style={[
        styles.iconContainer,
        isDark && styles.iconContainerDark
      ]}>
        <MaterialIcons 
          name="message" 
          size={64} 
          color={isDark ? "#444" : "#ddd"} 
        />
      </View>
      
      <Text style={[
        styles.emptyTitle, 
        isDark && styles.emptyTitleDark,
        fontsLoaded && styles.fontFamily
      ]}>
        No Bank Messages Found
      </Text>
      
      <Text style={[
        styles.emptySubtitle, 
        isDark && styles.emptySubtitleDark,
        fontsLoaded && styles.fontFamily
      ]}>
        We couldn't find any bank transaction messages in your SMS.
      </Text>
      
      <View style={styles.suggestionContainer}>
        <View style={styles.suggestionItem}>
          <MaterialIcons 
            name="security" 
            size={20} 
            color={isDark ? "#888" : "#666"} 
          />
          <Text style={[
            styles.suggestionText, 
            isDark && styles.suggestionTextDark,
            fontsLoaded && styles.fontFamily
          ]}>
            Make sure SMS permissions are granted
          </Text>
        </View>
        
        <View style={styles.suggestionItem}>
          <MaterialIcons 
            name="credit-card" 
            size={20} 
            color={isDark ? "#888" : "#666"} 
          />
          <Text style={[
            styles.suggestionText, 
            isDark && styles.suggestionTextDark,
            fontsLoaded && styles.fontFamily
          ]}>
            Check if you have recent bank transactions
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.retryButton,
          isDark && styles.retryButtonDark
        ]}
        onPress={onRefresh}
      >
        <MaterialIcons 
          name="refresh" 
          size={20} 
          color={isDark ? "#CDCDCD" : "#000"} 
          style={styles.retryIcon}
        />
        <Text style={[
          styles.retryButtonText,
          isDark && styles.retryButtonTextDark,
          fontsLoaded && styles.fontFamily
        ]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    minHeight: 400,
  },
  
  loadingContainer: {
    paddingVertical: 80,
  },
  
  loadingIcon: {
    marginBottom: 16,
    // Add rotation animation if needed
  },
  
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(241, 241, 241, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  iconContainerDark: {
    backgroundColor: 'rgba(24, 24, 24, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },
  emptyTitleDark: {
    color: '#CDCDCD',
  },
  
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 280,
  },
  emptySubtitleDark: {
    color: '#999',
  },
  
  suggestionContainer: {
    width: '100%',
    marginBottom: 32,
  },
  
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  
  suggestionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
    flex: 1,
  },
  suggestionTextDark: {
    color: '#888',
  },
  
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(241, 241, 241, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  retryButtonDark: {
    backgroundColor: 'rgba(24, 24, 24, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  retryIcon: {
    marginRight: 8,
  },
  
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 20,
  },
  retryButtonTextDark: {
    color: '#CDCDCD',
  },
  
  fontFamily: {
    fontFamily: 'Lexend_400Regular',
  },
});

export default EmptyMessagesList;