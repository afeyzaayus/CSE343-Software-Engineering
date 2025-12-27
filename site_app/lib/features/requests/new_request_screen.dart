import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/network/dio_provider.dart';
import '../../core/repos/requests_repo.dart';

/// Provides access to the [RequestsRepo].
final requestsRepoProvider = Provider<RequestsRepo>((ref) {
  return RequestsRepo(ref.read(dioProvider));
});

/// Screen for creating and submitting a new service request or complaint.
class NewRequestScreen extends ConsumerStatefulWidget {
  const NewRequestScreen({super.key});

  @override
  ConsumerState<NewRequestScreen> createState() => _NewRequestScreenState();
}

class _NewRequestScreenState extends ConsumerState<NewRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // Controllers for input fields
  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  
  // Constant theme color
  static const _primaryColor = Color(0xFF1A4F70);

  // Mapping backend enum values (keys) to UI display text (values).
  final Map<String, String> _categoryMap = {
    'MAINTENANCE': 'Bakım / Onarım',
    'COMPLAINT': 'Şikayet',
    'REQUEST': 'İstek / Talep',
    'OTHER': 'Diğer',
  };

  String _selectedCategory = 'MAINTENANCE';
  bool _sending = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  /// Validates the form and submits the data to the backend.
  Future<void> _submit() async {
    // Validate inputs
    if (!_formKey.currentState!.validate()) return;

    // Close keyboard
    FocusScope.of(context).unfocus();

    // Check authentication state
    final user = ref.read(authStateProvider).user;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Oturum bulunamadı. Lütfen tekrar giriş yapın.')),
      );
      return;
    }

    setState(() => _sending = true);
    
    try {
      final repo = ref.read(requestsRepoProvider);
      
      await repo.create(
        siteId: user.siteCode,
        userId: user.id,
        title: _titleCtrl.text.trim(),
        content: _contentCtrl.text.trim(),
        category: _selectedCategory,
      );

      if (!mounted) return;
      
      // Success Feedback
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Talep başarıyla oluşturuldu!'), 
          backgroundColor: Colors.green
        ),
      );
      
      // Return to previous screen
      Navigator.pop(context);

    } catch (e) {
      if (!mounted) return;
      
      // Error Feedback
      final errorMessage = e.toString().replaceAll('Exception:', '').trim();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Hata: $errorMessage'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Yeni Talep Oluştur'),
        backgroundColor: _primaryColor,
        foregroundColor: Colors.white,
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView( 
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // --- Category Dropdown ---
              const Text(
                'Kategori', 
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedCategory,
                    isExpanded: true,
                    icon: const Icon(Icons.arrow_drop_down, color: _primaryColor),
                    items: _categoryMap.entries.map((entry) {
                      return DropdownMenuItem<String>(
                        value: entry.key,
                        child: Text(entry.value),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedCategory = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // --- Title Input ---
              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(
                  labelText: 'Başlık',
                  hintText: 'Örn: Musluk Damlatıyor',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.title, color: Colors.grey),
                ),
                textInputAction: TextInputAction.next,
                validator: (v) => (v == null || v.trim().length < 3) 
                    ? 'Başlık en az 3 karakter olmalı' 
                    : null,
              ),
              const SizedBox(height: 16),

              // --- Content Input ---
              TextFormField(
                controller: _contentCtrl,
                decoration: const InputDecoration(
                  labelText: 'Açıklama', 
                  hintText: 'Sorunu detaylıca açıklayınız...',
                  alignLabelWithHint: true,
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.description, color: Colors.grey),
                ),
                maxLines: 5,
                validator: (v) => (v == null || v.trim().length < 5) 
                    ? 'Lütfen daha detaylı açıklama girin' 
                    : null,
              ),
              const SizedBox(height: 24),

              // --- Submit Button ---
              SizedBox(
                width: double.infinity,
                height: 50,
                child: FilledButton.icon(
                  onPressed: _sending ? null : _submit,
                  icon: _sending
                      ? const SizedBox(
                          width: 20, 
                          height: 20, 
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.send),
                  label: Text(
                    _sending ? 'Gönderiliyor...' : 'Talebi Gönder',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: _primaryColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}