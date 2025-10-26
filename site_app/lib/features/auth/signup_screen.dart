import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _f = GlobalKey<FormState>();

  final fullname = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  final pass = TextEditingController();
  final siteId = TextEditingController();
  final blockNo = TextEditingController();
  final apartmentNo = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Sign Up')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _f,
          child: ListView(
            children: [
              TextFormField(
                controller: fullname,
                decoration: const InputDecoration(labelText: 'Full Name'),
                validator: _req,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: email,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: _req,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: phone,
                decoration: const InputDecoration(labelText: 'Phone Number'),
                validator: _req,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: pass,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: _req,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: siteId,
                decoration: const InputDecoration(labelText: 'Site ID'),
                validator: _req,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: blockNo,
                decoration: const InputDecoration(labelText: 'Block No (optional)'),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: apartmentNo,
                decoration: const InputDecoration(labelText: 'Apartment No (optional)'),
              ),
              if (auth.error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    auth.error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () async {
                  if (_f.currentState!.validate()) {
/*                     // Site ID'yi sayıya dönüştür
                    final int? parsedSiteId = int.tryParse(siteId.text);

                    if (parsedSiteId == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Site ID must be a number')),
                      );
                      return;
                    } */

                    await ref.read(authStateProvider.notifier).signup(
                          fullName: fullname.text,
                          email: email.text,
                          phoneNumber: phone.text,
                          password: pass.text,
                          siteId: siteId.text,
                          blockNo: blockNo.text.isNotEmpty ? blockNo.text : null,
                          apartmentNo:
                              apartmentNo.text.isNotEmpty ? apartmentNo.text : null,
                        );

                    if (context.mounted) Navigator.pop(context);
                  }
                },
                child: const Text('Create Account'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String? _req(String? v) => (v == null || v.isEmpty) ? 'Required' : null;
}
