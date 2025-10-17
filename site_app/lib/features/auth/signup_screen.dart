import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_controller.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});
  @override ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _f = GlobalKey<FormState>();
  final name = TextEditingController();
  final surname = TextEditingController();
  final email = TextEditingController();
  final pass = TextEditingController();
  final siteCode = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Sign Up')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _f,
          child: ListView(children: [
            TextFormField(controller: name, decoration: const InputDecoration(labelText: 'Name'), validator: _req),
            const SizedBox(height: 8),
            TextFormField(controller: surname, decoration: const InputDecoration(labelText: 'Surname'), validator: _req),
            const SizedBox(height: 8),
            TextFormField(controller: email, decoration: const InputDecoration(labelText: 'Email'), validator: _req),
            const SizedBox(height: 8),
            TextFormField(controller: pass, decoration: const InputDecoration(labelText: 'Password'), obscureText: true, validator: _req),
            const SizedBox(height: 8),
            TextFormField(controller: siteCode, decoration: const InputDecoration(labelText: 'Site Code'), validator: _req),
            if (auth.error != null) Padding(padding: const EdgeInsets.only(top:8), child: Text(auth.error!, style: const TextStyle(color: Colors.red))),
            const SizedBox(height: 12),
            FilledButton(onPressed: () async {
              if (_f.currentState!.validate()) {
                await ref.read(authStateProvider.notifier).signup(
                  name: name.text, surname: surname.text, email: email.text, password: pass.text, siteCode: siteCode.text);
                if (context.mounted) Navigator.pop(context);
              }
            }, child: const Text('Create Account')),
          ]),
        ),
      ),
    );
  }

  String? _req(String? v) => (v==null||v.isEmpty)?'Required':null;
}
